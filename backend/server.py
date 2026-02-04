from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # bowls, ensaladas, wraps
    price: float
    image_url: str
    ingredients: List[Ingredient] = []
    food_cost: float = 0.0
    tax_rate: float = 0.10
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    image_url: str
    ingredients: List[Ingredient] = []
    food_cost: float = 0.0
    is_available: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = None
    food_cost: Optional[float] = None
    is_available: Optional[bool] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    product_name: str
    price: float

class OrderCreate(BaseModel):
    items: List[CartItem]
    customer_name: str
    customer_email: str
    customer_phone: str
    pickup_time: str
    notes: Optional[str] = ""

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem]
    customer_name: str
    customer_email: str
    customer_phone: str
    pickup_time: str
    notes: str = ""
    total: float
    status: str = "pending"  # pending, paid, preparing, ready, completed, cancelled
    payment_method: Optional[str] = None
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str = "eur"
    payment_method: str  # stripe, paypal
    status: str = "pending"  # pending, paid, failed, expired
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    username: str
    password: str

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str
    payment_method: str = "stripe"  # stripe or paypal

# ==================== INITIAL PRODUCTS (Escandallos) ====================

INITIAL_PRODUCTS = [
    {
        "name": "Bowl de Quinoa",
        "description": "Quinoa cocida con pechuga de pollo, espárragos verdes, habas, fresas, aguacate y vinagreta de albahaca",
        "category": "bowls",
        "price": 13.00,
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        "food_cost": 0.43,
        "ingredients": [
            {"name": "Quinoa cocida", "quantity": 60, "unit": "g", "unit_cost": 0.051, "total_cost": 0.051},
            {"name": "Pechuga de pollo", "quantity": 120, "unit": "g", "unit_cost": 0.1308, "total_cost": 0.1308},
            {"name": "Espárragos verdes", "quantity": 60, "unit": "g", "unit_cost": 0.0659, "total_cost": 0.0659},
            {"name": "Habas", "quantity": 40, "unit": "g", "unit_cost": 0.022, "total_cost": 0.022},
            {"name": "Fresas", "quantity": 60, "unit": "g", "unit_cost": 0.03, "total_cost": 0.03},
            {"name": "Aguacate", "quantity": 50, "unit": "g", "unit_cost": 0.0425, "total_cost": 0.0425},
            {"name": "Vinagreta", "quantity": 40, "unit": "ml", "unit_cost": 0.02, "total_cost": 0.02}
        ]
    },
    {
        "name": "Ensalada de Alcachofa Fría",
        "description": "Alcachofa confitada con guisantes, pera, nueces, queso de cabra y vinagreta",
        "category": "ensaladas",
        "price": 9.00,
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
        "food_cost": 0.30,
        "ingredients": [
            {"name": "Alcachofa confitada", "quantity": 120, "unit": "g", "unit_cost": 0.0452, "total_cost": 0.0452},
            {"name": "Guisantes", "quantity": 50, "unit": "g", "unit_cost": 0.05, "total_cost": 0.05},
            {"name": "Pera", "quantity": 60, "unit": "g", "unit_cost": 0.024, "total_cost": 0.024},
            {"name": "Nueces", "quantity": 15, "unit": "g", "unit_cost": 0.027, "total_cost": 0.027},
            {"name": "Queso de cabra", "quantity": 30, "unit": "g", "unit_cost": 0.0747, "total_cost": 0.0747}
        ]
    },
    {
        "name": "Poke Bowl de Tofu",
        "description": "Arroz integral con tofu marinado, espinacas frescas, zanahoria rallada, mango y sésamo",
        "category": "bowls",
        "price": 11.00,
        "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
        "food_cost": 0.29,
        "ingredients": [
            {"name": "Arroz integral cocido", "quantity": 90, "unit": "g", "unit_cost": 0.0405, "total_cost": 0.0405},
            {"name": "Tofu marinado", "quantity": 90, "unit": "g", "unit_cost": 0.108, "total_cost": 0.108},
            {"name": "Espinacas frescas", "quantity": 60, "unit": "g", "unit_cost": 0.036, "total_cost": 0.036},
            {"name": "Zanahoria rallada", "quantity": 40, "unit": "g", "unit_cost": 0.014, "total_cost": 0.014},
            {"name": "Mango", "quantity": 60, "unit": "g", "unit_cost": 0.03, "total_cost": 0.03}
        ]
    },
    {
        "name": "Lentejas con Coliflor Asada",
        "description": "Lentejas cocidas con coliflor asada, cebolla caramelizada y pimiento verde",
        "category": "bowls",
        "price": 9.00,
        "image_url": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800",
        "food_cost": 0.18,
        "ingredients": [
            {"name": "Lentejas cocidas", "quantity": 150, "unit": "g", "unit_cost": 0.0525, "total_cost": 0.0525},
            {"name": "Coliflor asada", "quantity": 150, "unit": "g", "unit_cost": 0.045, "total_cost": 0.045},
            {"name": "Cebolla", "quantity": 30, "unit": "g", "unit_cost": 0.006, "total_cost": 0.006},
            {"name": "Pimiento verde", "quantity": 20, "unit": "g", "unit_cost": 0.0056, "total_cost": 0.0056}
        ]
    },
    {
        "name": "Wrap de Lechuga",
        "description": "Hojas de lechuga romana rellenas de zanahoria, aguacate, pepino y salsa de yogur",
        "category": "wraps",
        "price": 8.00,
        "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
        "food_cost": 0.15,
        "ingredients": [
            {"name": "Lechuga romana", "quantity": 40, "unit": "g", "unit_cost": 0.01, "total_cost": 0.01},
            {"name": "Zanahoria", "quantity": 40, "unit": "g", "unit_cost": 0.0044, "total_cost": 0.0044},
            {"name": "Aguacate", "quantity": 40, "unit": "g", "unit_cost": 0.034, "total_cost": 0.034},
            {"name": "Pepino", "quantity": 40, "unit": "g", "unit_cost": 0.013, "total_cost": 0.013},
            {"name": "Salsa de yogur", "quantity": 50, "unit": "ml", "unit_cost": 0.0325, "total_cost": 0.0325}
        ]
    },
    {
        "name": "Bowl de Fideos de Arroz",
        "description": "Fideos de arroz salteados con brotes de soja, calabacín, zanahoria y setas",
        "category": "bowls",
        "price": 10.00,
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
        "food_cost": 0.24,
        "ingredients": [
            {"name": "Fideos de arroz", "quantity": 90, "unit": "g", "unit_cost": 0.0895, "total_cost": 0.0895},
            {"name": "Brotes de soja", "quantity": 30, "unit": "g", "unit_cost": 0.018, "total_cost": 0.018},
            {"name": "Calabacín", "quantity": 60, "unit": "g", "unit_cost": 0.0179, "total_cost": 0.0179},
            {"name": "Zanahoria", "quantity": 40, "unit": "g", "unit_cost": 0.0044, "total_cost": 0.0044},
            {"name": "Setas", "quantity": 60, "unit": "g", "unit_cost": 0.0454, "total_cost": 0.0454}
        ]
    },
    {
        "name": "Ensalada Verde con Pollo",
        "description": "Mix de espinacas con pechuga de pollo, patatas, almendras laminadas y vinagreta",
        "category": "ensaladas",
        "price": 11.00,
        "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
        "food_cost": 0.28,
        "ingredients": [
            {"name": "Pechuga de pollo", "quantity": 120, "unit": "g", "unit_cost": 0.1308, "total_cost": 0.1308},
            {"name": "Espinacas", "quantity": 50, "unit": "g", "unit_cost": 0.03, "total_cost": 0.03},
            {"name": "Patatas", "quantity": 100, "unit": "g", "unit_cost": 0.02, "total_cost": 0.02},
            {"name": "Almendras laminadas", "quantity": 15, "unit": "g", "unit_cost": 0.03, "total_cost": 0.03}
        ]
    },
    {
        "name": "Tazón de Avena Salada",
        "description": "Avena con berenjena asada, pimiento rojo, cebolla caramelizada y hummus",
        "category": "bowls",
        "price": 9.00,
        "image_url": "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=800",
        "food_cost": 0.17,
        "ingredients": [
            {"name": "Avena", "quantity": 80, "unit": "g", "unit_cost": 0.028, "total_cost": 0.028},
            {"name": "Berenjena", "quantity": 60, "unit": "g", "unit_cost": 0.0131, "total_cost": 0.0131},
            {"name": "Pimiento rojo", "quantity": 60, "unit": "g", "unit_cost": 0.0179, "total_cost": 0.0179},
            {"name": "Cebolla", "quantity": 40, "unit": "g", "unit_cost": 0.008, "total_cost": 0.008},
            {"name": "Hummus", "quantity": 50, "unit": "g", "unit_cost": 0.0425, "total_cost": 0.0425}
        ]
    },
    {
        "name": "Bowl Mediterráneo",
        "description": "Garbanzos con tomate, pepino, aceitunas, queso feta y orégano fresco",
        "category": "bowls",
        "price": 9.00,
        "image_url": "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=800",
        "food_cost": 0.20,
        "ingredients": [
            {"name": "Garbanzos cocidos", "quantity": 80, "unit": "g", "unit_cost": 0.036, "total_cost": 0.036},
            {"name": "Tomate", "quantity": 60, "unit": "g", "unit_cost": 0.024, "total_cost": 0.024},
            {"name": "Pepino", "quantity": 50, "unit": "g", "unit_cost": 0.0163, "total_cost": 0.0163},
            {"name": "Aceitunas", "quantity": 15, "unit": "g", "unit_cost": 0.0128, "total_cost": 0.0128},
            {"name": "Queso feta", "quantity": 30, "unit": "g", "unit_cost": 0.0428, "total_cost": 0.0428}
        ]
    }
]

# ==================== STARTUP EVENT ====================

# IDs fijos para productos iniciales (para que no se borren)
INITIAL_PRODUCT_IDS = [
    "prod-quinoa-bowl-001",
    "prod-alcachofa-002",
    "prod-poke-tofu-003",
    "prod-lentejas-004",
    "prod-wrap-lechuga-005",
    "prod-fideos-arroz-006",
    "prod-ensalada-pollo-007",
    "prod-avena-salada-008",
    "prod-mediterraneo-009"
]

@app.on_event("startup")
async def startup_event():
    """Initialize products - ensures all initial products exist"""
    logger.info("Checking products database...")
    
    # Verificar cada producto inicial y añadirlo si falta
    for idx, product_data in enumerate(INITIAL_PRODUCTS):
        fixed_id = INITIAL_PRODUCT_IDS[idx]
        existing = await db.products.find_one({"id": fixed_id})
        
        if not existing:
            logger.info(f"Adding missing product: {product_data['name']}")
            product_data_copy = product_data.copy()
            product_data_copy['id'] = fixed_id
            product = Product(**product_data_copy)
            doc = product.model_dump()
            doc['id'] = fixed_id  # Asegurar ID fijo
            doc['created_at'] = doc['created_at'].isoformat()
            await db.products.insert_one(doc)
    
    count = await db.products.count_documents({})
    logger.info(f"Products database ready: {count} products")

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, available_only: bool = True):
    """Get all products, optionally filtered by category"""
    query = {}
    if category:
        query["category"] = category
    if available_only:
        query["is_available"] = True
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate):
    """Create a new product (admin only)"""
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    """Update a product (admin only)"""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product (admin only) - Cannot delete initial products"""
    # No permitir borrar productos iniciales
    if product_id in INITIAL_PRODUCT_IDS:
        raise HTTPException(
            status_code=403, 
            detail="No se pueden eliminar los productos iniciales del menú. Solo puedes desactivarlos."
        )
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    total = sum(item.price * item.quantity for item in order_data.items)
    
    order = Order(
        items=order_data.items,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        pickup_time=order_data.pickup_time,
        notes=order_data.notes or "",
        total=round(total, 2)
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    """Get all orders (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for o in orders:
        if isinstance(o.get('created_at'), str):
            o['created_at'] = datetime.fromisoformat(o['created_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a single order by ID"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status (admin only)"""
    valid_statuses = ["pending", "paid", "preparing", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": f"Order status updated to {status}"}

# ==================== PAYMENT ENDPOINTS ====================

@api_router.post("/checkout/stripe")
async def create_stripe_checkout(checkout_req: CheckoutRequest, request: Request):
    """Create Stripe checkout session"""
    # Get order
    order = await db.orders.find_one({"id": checkout_req.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Initialize Stripe
    stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Build URLs from origin
    origin = checkout_req.origin_url.rstrip('/')
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/checkout?order_id={checkout_req.order_id}"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(order['total']),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": checkout_req.order_id,
            "customer_email": order['customer_email']
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Save payment transaction
    transaction = PaymentTransaction(
        order_id=checkout_req.order_id,
        session_id=session.session_id,
        amount=float(order['total']),
        currency="eur",
        payment_method="stripe",
        status="pending",
        metadata={"customer_email": order['customer_email']}
    )
    
    tx_doc = transaction.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    await db.payment_transactions.insert_one(tx_doc)
    
    # Update order with session info
    await db.orders.update_one(
        {"id": checkout_req.order_id},
        {"$set": {"payment_session_id": session.session_id, "payment_method": "stripe"}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get payment status for a checkout session"""
    stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction and order if paid
        if status.payment_status == "paid":
            # Check if already processed
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx and tx.get('status') != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "paid"}}
                )
                await db.orders.update_one(
                    {"payment_session_id": session_id},
                    {"$set": {"status": "paid"}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid"}}
            )
            await db.orders.update_one(
                {"payment_session_id": session_id},
                {"$set": {"status": "paid"}}
            )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ==================== ADMIN ENDPOINTS ====================

ADMIN_USERNAME = "Admin"
ADMIN_PASSWORD = "Admin"

@api_router.post("/admin/login")
async def admin_login(login_data: AdminLogin):
    """Admin login - simple hardcoded credentials"""
    if login_data.username == ADMIN_USERNAME and login_data.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful", "token": "admin-token-123"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin dashboard statistics"""
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    paid_orders = await db.orders.count_documents({"status": "paid"})
    
    # Calculate total revenue from paid orders
    paid_orders_list = await db.orders.find({"status": {"$in": ["paid", "completed"]}}, {"total": 1}).to_list(1000)
    total_revenue = sum(o.get('total', 0) for o in paid_orders_list)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "paid_orders": paid_orders,
        "total_revenue": round(total_revenue, 2)
    }

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "En Tu Sano Juicio API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
