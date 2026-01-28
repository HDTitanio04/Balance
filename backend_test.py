#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EnTuSanoJuicioAPITester:
    def __init__(self, base_url="https://fusionfoods.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_result="", actual_result=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED")
            if details:
                print(f"   Details: {details}")
        
        self.test_results.append({
            "test_name": name,
            "status": "PASSED" if success else "FAILED",
            "details": details,
            "expected": expected_result,
            "actual": actual_result
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_message = "En Tu Sano Juicio API"
                actual_message = data.get('message', '')
                success = expected_message in actual_message
                self.log_test(
                    "API Root Endpoint", 
                    success,
                    f"Status: {response.status_code}, Message: {actual_message}",
                    expected_message,
                    actual_message
                )
            else:
                self.log_test(
                    "API Root Endpoint", 
                    False,
                    f"Status: {response.status_code}",
                    "200",
                    str(response.status_code)
                )
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_get_products(self):
        """Test GET /api/products - should return 9 products"""
        try:
            response = requests.get(f"{self.api_url}/products", timeout=10)
            success = response.status_code == 200
            
            if success:
                products = response.json()
                expected_count = 9
                actual_count = len(products)
                success = actual_count == expected_count
                
                # Check product structure
                if success and products:
                    sample_product = products[0]
                    required_fields = ['id', 'name', 'description', 'category', 'price', 'image_url']
                    missing_fields = [field for field in required_fields if field not in sample_product]
                    
                    if missing_fields:
                        success = False
                        details = f"Missing fields in product: {missing_fields}"
                    else:
                        # Check categories
                        categories = set(p['category'] for p in products)
                        expected_categories = {'bowls', 'ensaladas', 'wraps'}
                        if not expected_categories.issubset(categories):
                            details = f"Found {actual_count} products with categories: {categories}"
                        else:
                            details = f"Found {actual_count} products with correct structure and categories: {categories}"
                else:
                    details = f"Expected {expected_count} products, got {actual_count}"
                
                self.log_test(
                    "GET /api/products", 
                    success,
                    details,
                    f"{expected_count} products with correct structure",
                    f"{actual_count} products"
                )
            else:
                self.log_test(
                    "GET /api/products", 
                    False,
                    f"Status: {response.status_code}",
                    "200",
                    str(response.status_code)
                )
            return success
        except Exception as e:
            self.log_test("GET /api/products", False, f"Exception: {str(e)}")
            return False

    def test_admin_login(self):
        """Test POST /api/admin/login with Admin/Admin credentials"""
        try:
            login_data = {
                "username": "Admin",
                "password": "Admin"
            }
            response = requests.post(
                f"{self.api_url}/admin/login", 
                json=login_data,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_success = True
                actual_success = data.get('success', False)
                has_token = 'token' in data
                
                success = actual_success and has_token
                
                if success:
                    self.token = data['token']
                    details = f"Login successful, token received: {data.get('token', '')[:20]}..."
                else:
                    details = f"Success: {actual_success}, Has token: {has_token}"
                
                self.log_test(
                    "POST /api/admin/login", 
                    success,
                    details,
                    "success=True with token",
                    f"success={actual_success}, token={has_token}"
                )
            else:
                self.log_test(
                    "POST /api/admin/login", 
                    False,
                    f"Status: {response.status_code}",
                    "200",
                    str(response.status_code)
                )
            return success
        except Exception as e:
            self.log_test("POST /api/admin/login", False, f"Exception: {str(e)}")
            return False

    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        try:
            response = requests.get(f"{self.api_url}/admin/stats", timeout=10)
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                required_fields = ['total_products', 'total_orders', 'pending_orders', 'paid_orders', 'total_revenue']
                missing_fields = [field for field in required_fields if field not in stats]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields in stats: {missing_fields}"
                else:
                    # Check if total_products matches expected count (9)
                    expected_products = 9
                    actual_products = stats.get('total_products', 0)
                    
                    details = f"Stats: products={actual_products}, orders={stats.get('total_orders', 0)}, revenue={stats.get('total_revenue', 0)}€"
                    
                    if actual_products != expected_products:
                        print(f"   Warning: Expected {expected_products} products, got {actual_products}")
                
                self.log_test(
                    "GET /api/admin/stats", 
                    success,
                    details,
                    "All required stats fields present",
                    f"Fields: {list(stats.keys())}"
                )
            else:
                self.log_test(
                    "GET /api/admin/stats", 
                    False,
                    f"Status: {response.status_code}",
                    "200",
                    str(response.status_code)
                )
            return success
        except Exception as e:
            self.log_test("GET /api/admin/stats", False, f"Exception: {str(e)}")
            return False

    def test_create_order(self):
        """Test creating an order"""
        try:
            # First get a product to create order with
            products_response = requests.get(f"{self.api_url}/products", timeout=10)
            if products_response.status_code != 200:
                self.log_test("Create Order (Get Products)", False, "Could not fetch products for order test")
                return False
            
            products = products_response.json()
            if not products:
                self.log_test("Create Order (No Products)", False, "No products available for order test")
                return False
            
            # Create test order
            test_product = products[0]
            order_data = {
                "items": [{
                    "product_id": test_product['id'],
                    "product_name": test_product['name'],
                    "price": test_product['price'],
                    "quantity": 1
                }],
                "customer_name": "Test Customer",
                "customer_email": "test@example.com",
                "customer_phone": "+34 123 456 789",
                "pickup_time": "14:30",
                "notes": "Test order"
            }
            
            response = requests.post(
                f"{self.api_url}/orders",
                json=order_data,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                order = response.json()
                required_fields = ['id', 'items', 'customer_name', 'total', 'status']
                missing_fields = [field for field in required_fields if field not in order]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields in order: {missing_fields}"
                else:
                    expected_total = test_product['price']
                    actual_total = order.get('total', 0)
                    total_correct = abs(expected_total - actual_total) < 0.01
                    
                    if not total_correct:
                        success = False
                        details = f"Total mismatch: expected {expected_total}€, got {actual_total}€"
                    else:
                        details = f"Order created successfully: ID={order.get('id', '')[:8]}..., Total={actual_total}€"
                
                self.log_test(
                    "POST /api/orders", 
                    success,
                    details,
                    f"Order with total {expected_total}€",
                    f"Order with total {actual_total}€"
                )
            else:
                self.log_test(
                    "POST /api/orders", 
                    False,
                    f"Status: {response.status_code}",
                    "200",
                    str(response.status_code)
                )
            return success
        except Exception as e:
            self.log_test("POST /api/orders", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting En Tu Sano Juicio Backend API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test API connectivity first
        if not self.test_api_root():
            print("\n❌ API root endpoint failed - stopping tests")
            return False
        
        # Core API tests
        self.test_get_products()
        self.test_admin_login()
        self.test_admin_stats()
        self.test_create_order()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests PASSED!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests FAILED")
            return False

    def get_test_report(self):
        """Get detailed test report"""
        return {
            "timestamp": datetime.now().isoformat(),
            "api_url": self.api_url,
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = EnTuSanoJuicioAPITester()
    success = tester.run_all_tests()
    
    # Save detailed report
    report = tester.get_test_report()
    with open('/app/backend_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: /app/backend_test_report.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())