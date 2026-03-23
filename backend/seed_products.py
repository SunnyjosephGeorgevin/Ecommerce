import sys
import os

# Fix import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models.product import Product

db = SessionLocal()

# Optional: clear existing products
db.query(Product).delete()
db.commit()

products = [
    # 👟 SNEAKERS (20)
    {"name": "Nike Air Max 90", "price": 199, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,nike", "description": "Classic Nike running sneakers with superior comfort", "stock": 20, "seller_id": 1},
    {"name": "Nike Air Force 1", "price": 180, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,nike,air", "description": "Iconic streetwear sneakers with timeless design", "stock": 18, "seller_id": 1},
    {"name": "Adidas Ultraboost", "price": 220, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,adidas", "description": "High-performance running shoes with energy return", "stock": 15, "seller_id": 1},
    {"name": "Adidas Superstar", "price": 120, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/shoes,adidas", "description": "Classic shell-toe sneakers for everyday wear", "stock": 25, "seller_id": 1},
    {"name": "Puma RS-X", "price": 150, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,puma", "description": "Bold design sneakers with cushioned comfort", "stock": 20, "seller_id": 1},
    {"name": "Reebok Classic Leather", "price": 110, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,reebok", "description": "Minimal leather sneakers for casual style", "stock": 22, "seller_id": 1},
    {"name": "New Balance 574 Core", "price": 130, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,newbalance", "description": "Retro-inspired sneakers with modern comfort", "stock": 16, "seller_id": 1},
    {"name": "ASICS Gel-Kayano", "price": 180, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,asics", "description": "Stability running shoes for long-distance comfort", "stock": 14, "seller_id": 1},
    {"name": "Under Armour HOVR Phantom", "price": 160, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,underarmour", "description": "Responsive cushioning for athletic performance", "stock": 17, "seller_id": 1},
    {"name": "Converse Chuck Taylor", "price": 90, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,converse", "description": "Classic canvas sneakers with iconic style", "stock": 30, "seller_id": 1},
    {"name": "Vans Old Skool", "price": 95, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,vans", "description": "Skate-inspired sneakers with durable design", "stock": 21, "seller_id": 1},
    {"name": "Jordan Air Jordan 4", "price": 250, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,jordan", "description": "Premium basketball sneakers with iconic look", "stock": 10, "seller_id": 1},
    {"name": "Balenciaga Triple S", "price": 900, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,balenciaga", "description": "Luxury oversized sneakers with bold aesthetics", "stock": 5, "seller_id": 1},
    {"name": "Gucci Ace Sneaker", "price": 750, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,gucci", "description": "Luxury sneakers with signature Gucci styling", "stock": 6, "seller_id": 1},
    {"name": "Prada Cloudbust", "price": 700, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,prada", "description": "Futuristic sneakers with premium build quality", "stock": 4, "seller_id": 1},
    {"name": "Off-White Out of Office", "price": 600, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,offwhite", "description": "Streetwear sneakers with bold branding", "stock": 8, "seller_id": 1},
    {"name": "Y-3 Kaiwa", "price": 400, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,y3", "description": "Designer sneakers blending sport and fashion", "stock": 9, "seller_id": 1},
    {"name": "Nike ZoomX Vaporfly", "price": 250, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/running,shoes,nike", "description": "Elite racing shoes for maximum speed", "stock": 11, "seller_id": 1},
    {"name": "Adidas NMD R1", "price": 170, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/sneaker,nmd", "description": "Urban sneakers with responsive cushioning", "stock": 19, "seller_id": 1},
    {"name": "Puma Suede Classic", "price": 100, "category": "sneakers", "image_url": "https://loremflickr.com/600/600/shoes,puma", "description": "Timeless suede sneakers for everyday wear", "stock": 23, "seller_id": 1},

    # 👕 APPAREL (20)
    {"name": "Nike Sports Hoodie", "price": 80, "category": "apparel", "image_url": "https://loremflickr.com/600/600/hoodie,nike", "description": "Comfortable hoodie for workouts and casual wear", "stock": 30, "seller_id": 1},
    {"name": "Nike Track Pants", "price": 70, "category": "apparel", "image_url": "https://loremflickr.com/600/600/trackpants,nike", "description": "Lightweight pants designed for training sessions", "stock": 25, "seller_id": 1},
    {"name": "Adidas Training Jacket", "price": 100, "category": "apparel", "image_url": "https://loremflickr.com/600/600/jacket,adidas", "description": "Stylish jacket for outdoor workouts", "stock": 20, "seller_id": 1},
    {"name": "Adidas Running Shorts", "price": 50, "category": "apparel", "image_url": "https://loremflickr.com/600/600/shorts,adidas", "description": "Breathable shorts for running and fitness", "stock": 28, "seller_id": 1},
    {"name": "Puma Casual Hoodie", "price": 75, "category": "apparel", "image_url": "https://loremflickr.com/600/600/hoodie,puma", "description": "Soft hoodie for everyday comfort", "stock": 26, "seller_id": 1},
    {"name": "Zara Denim Jacket", "price": 120, "category": "apparel", "image_url": "https://loremflickr.com/600/600/denim,jacket", "description": "Classic denim jacket with modern fit", "stock": 12, "seller_id": 1},
    {"name": "H&M Basic T-Shirt", "price": 25, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tshirt,basic", "description": "Essential cotton t-shirt for daily wear", "stock": 40, "seller_id": 1},
    {"name": "Levi's Denim Jeans", "price": 90, "category": "apparel", "image_url": "https://loremflickr.com/600/600/jeans,levis", "description": "Durable denim jeans with classic fit", "stock": 22, "seller_id": 1},
    {"name": "Uniqlo Airism Tee", "price": 30, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tshirt,uniqlo", "description": "Lightweight breathable t-shirt for comfort", "stock": 35, "seller_id": 1},
    {"name": "Gucci Luxury Hoodie", "price": 600, "category": "apparel", "image_url": "https://loremflickr.com/600/600/hoodie,gucci", "description": "High-end hoodie with premium fabric", "stock": 6, "seller_id": 1},
    {"name": "Balenciaga Oversized Tee", "price": 500, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tshirt,balenciaga", "description": "Designer oversized t-shirt for streetwear", "stock": 8, "seller_id": 1},
    {"name": "Supreme Logo Tee", "price": 300, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tshirt,supreme", "description": "Iconic streetwear t-shirt with bold logo", "stock": 10, "seller_id": 1},
    {"name": "Tommy Hilfiger Polo Shirt", "price": 80, "category": "apparel", "image_url": "https://loremflickr.com/600/600/polo,shirt", "description": "Premium polo shirt with classic design", "stock": 18, "seller_id": 1},
    {"name": "Calvin Klein Sweatshirt", "price": 90, "category": "apparel", "image_url": "https://loremflickr.com/600/600/sweatshirt,ck", "description": "Minimal sweatshirt with modern fit", "stock": 16, "seller_id": 1},
    {"name": "Zara Slim Fit Shirt", "price": 60, "category": "apparel", "image_url": "https://loremflickr.com/600/600/shirt,zara", "description": "Stylish shirt for formal and casual wear", "stock": 20, "seller_id": 1},
    {"name": "H&M Winter Sweater", "price": 55, "category": "apparel", "image_url": "https://loremflickr.com/600/600/sweater,winter", "description": "Warm sweater for cold weather", "stock": 24, "seller_id": 1},
    {"name": "Levi's Trucker Jacket", "price": 110, "category": "apparel", "image_url": "https://loremflickr.com/600/600/jacket,levis", "description": "Classic trucker jacket with rugged style", "stock": 14, "seller_id": 1},
    {"name": "Uniqlo Puffer Jacket", "price": 140, "category": "apparel", "image_url": "https://loremflickr.com/600/600/puffer,jacket", "description": "Lightweight insulated jacket for winter", "stock": 12, "seller_id": 1},
    {"name": "Puma Gym T-Shirt", "price": 40, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tshirt,gym", "description": "Performance t-shirt for workouts", "stock": 30, "seller_id": 1},
    {"name": "Adidas Sports Tank", "price": 35, "category": "apparel", "image_url": "https://loremflickr.com/600/600/tanktop,sports", "description": "Breathable tank top for training", "stock": 27, "seller_id": 1},

    # ⌚ ACCESSORIES (20)
    {"name": "Apple Watch Series 9", "price": 400, "category": "accessories", "image_url": "https://loremflickr.com/600/600/smartwatch,apple", "description": "Advanced smartwatch with health tracking", "stock": 15, "seller_id": 1},
    {"name": "Samsung Galaxy Watch", "price": 350, "category": "accessories", "image_url": "https://loremflickr.com/600/600/smartwatch,samsung", "description": "Smartwatch with fitness and connectivity features", "stock": 14, "seller_id": 1},
    {"name": "Fossil Leather Watch", "price": 180, "category": "accessories", "image_url": "https://loremflickr.com/600/600/watch,leather", "description": "Classic analog watch with leather strap", "stock": 12, "seller_id": 1},
    {"name": "Ray-Ban Aviator Sunglasses", "price": 150, "category": "accessories", "image_url": "https://loremflickr.com/600/600/sunglasses,rayban", "description": "Iconic sunglasses with timeless style", "stock": 20, "seller_id": 1},
    {"name": "Oakley Sport Sunglasses", "price": 130, "category": "accessories", "image_url": "https://loremflickr.com/600/600/sunglasses,sport", "description": "Performance sunglasses for active lifestyle", "stock": 18, "seller_id": 1},
    {"name": "Gucci Leather Belt", "price": 450, "category": "accessories", "image_url": "https://loremflickr.com/600/600/belt,leather", "description": "Luxury belt with premium craftsmanship", "stock": 6, "seller_id": 1},
    {"name": "Louis Vuitton Wallet", "price": 700, "category": "accessories", "image_url": "https://loremflickr.com/600/600/wallet,designer", "description": "Designer wallet with elegant design", "stock": 5, "seller_id": 1},
    {"name": "Prada Card Holder", "price": 500, "category": "accessories", "image_url": "https://loremflickr.com/600/600/cardholder,prada", "description": "Compact luxury card holder", "stock": 7, "seller_id": 1},
    {"name": "Nike Gym Bag", "price": 60, "category": "accessories", "image_url": "https://loremflickr.com/600/600/gymbag,nike", "description": "Durable gym bag with ample storage", "stock": 22, "seller_id": 1},
    {"name": "Adidas Backpack", "price": 70, "category": "accessories", "image_url": "https://loremflickr.com/600/600/backpack,adidas", "description": "Stylish backpack for daily use", "stock": 25, "seller_id": 1},
    {"name": "Puma Sports Cap", "price": 35, "category": "accessories", "image_url": "https://loremflickr.com/600/600/cap,sports", "description": "Comfortable cap for sports and casual wear", "stock": 30, "seller_id": 1},
    {"name": "New Era Baseball Cap", "price": 40, "category": "accessories", "image_url": "https://loremflickr.com/600/600/baseballcap", "description": "Classic baseball cap with premium fit", "stock": 28, "seller_id": 1},
    {"name": "Casio G-Shock Watch", "price": 120, "category": "accessories", "image_url": "https://loremflickr.com/600/600/watch,gshock", "description": "Rugged watch built for durability", "stock": 16, "seller_id": 1},
    {"name": "Rolex Submariner", "price": 10000, "category": "accessories", "image_url": "https://loremflickr.com/600/600/watch,rolex", "description": "Luxury dive watch with iconic status", "stock": 2, "seller_id": 1},
    {"name": "Titan Analog Watch", "price": 90, "category": "accessories", "image_url": "https://loremflickr.com/600/600/watch,analog", "description": "Elegant analog watch for formal wear", "stock": 18, "seller_id": 1},
    {"name": "Noise Smart Band", "price": 50, "category": "accessories", "image_url": "https://loremflickr.com/600/600/smartband", "description": "Affordable fitness tracker with smart features", "stock": 35, "seller_id": 1},
    {"name": "Boat Wireless Earbuds", "price": 60, "category": "accessories", "image_url": "https://loremflickr.com/600/600/earbuds,wireless", "description": "Compact earbuds with great sound quality", "stock": 32, "seller_id": 1},
    {"name": "Sony Headphones", "price": 200, "category": "accessories", "image_url": "https://loremflickr.com/600/600/headphones,sony", "description": "Premium headphones with noise cancellation", "stock": 14, "seller_id": 1},
    {"name": "JBL Bluetooth Speaker", "price": 150, "category": "accessories", "image_url": "https://loremflickr.com/600/600/speaker,bluetooth", "description": "Portable speaker with powerful sound", "stock": 20, "seller_id": 1},
    {"name": "Gucci Luxury Sunglasses", "price": 800, "category": "accessories", "image_url": "https://loremflickr.com/600/600/sunglasses,gucci", "description": "High-end sunglasses with designer appeal", "stock": 5, "seller_id": 1},

    # 💻 LAPTOPS (20)
    {"name": "MacBook Pro 16-inch", "price": 2499, "category": "laptop", "image_url": "https://loremflickr.com/600/600/macbook,pro", "description": "Powerful laptop with M3 Max chip for professionals", "stock": 15, "seller_id": 1},
    {"name": "MacBook Air M2", "price": 1199, "category": "laptop", "image_url": "https://loremflickr.com/600/600/macbook,air", "description": "Lightweight and incredibly thin with great battery life", "stock": 25, "seller_id": 1},
    {"name": "Dell XPS 15", "price": 1899, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,dell", "description": "Premium Windows laptop with stunning OLED display", "stock": 12, "seller_id": 1},
    {"name": "ThinkPad X1 Carbon", "price": 1699, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,thinkpad", "description": "The ultimate business laptop with unmatched keyboard", "stock": 20, "seller_id": 1},
    {"name": "ASUS ROG Zephyrus G14", "price": 1499, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,gaming", "description": "Compact gaming powerhouse with AMD Ryzen processors", "stock": 18, "seller_id": 1},
    {"name": "Razer Blade 15", "price": 2299, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,razer", "description": "Premium build quality with high-end gaming performance", "stock": 8, "seller_id": 1},
    {"name": "HP Spectre x360", "price": 1399, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,hp", "description": "Elegant 2-in-1 convertible with active pen support", "stock": 14, "seller_id": 1},
    {"name": "Alienware m16", "price": 2199, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,alienware", "description": "Desktop-class gaming performance in a portable chassis", "stock": 10, "seller_id": 1},
    {"name": "Lenovo Legion 5 Pro", "price": 1599, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,lenovo", "description": "Excellent thermal design for sustained gaming sessions", "stock": 16, "seller_id": 1},
    {"name": "Microsoft Surface Laptop 5", "price": 1299, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,surface", "description": "Sleek and stylish everyday Windows laptop", "stock": 22, "seller_id": 1},
    {"name": "Acer Swift 3", "price": 799, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,acer", "description": "Budget-friendly thin and light notebook", "stock": 30, "seller_id": 1},
    {"name": "LG Gram 17", "price": 1699, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,lg", "description": "Incredibly lightweight large-screen laptop", "stock": 11, "seller_id": 1},
    {"name": "Gigabyte AERO 16", "price": 1999, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,gigabyte", "description": "Creator-focused laptop with color-accurate display", "stock": 7, "seller_id": 1},
    {"name": "ASUS ZenBook 14", "price": 1099, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,asus", "description": "Ultra-portable productivity machine with NumPad", "stock": 19, "seller_id": 1},
    {"name": "HP Envy 13", "price": 999, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,office", "description": "Reliable and stylish work-from-home companion", "stock": 24, "seller_id": 1},
    {"name": "MSI Stealth 15M", "price": 1399, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,msi", "description": "Slim form factor gaming laptop for creators", "stock": 13, "seller_id": 1},
    {"name": "Dell Inspiron 15", "price": 650, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,desk", "description": "Dependable everyday laptop for students", "stock": 35, "seller_id": 1},
    {"name": "ThinkPad T14", "price": 1450, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,business", "description": "Durable and secure enterprise workhorse", "stock": 17, "seller_id": 1},
    {"name": "Acer Predator Helios 300", "price": 1299, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,esports", "description": "High refresh rate display for competitive gaming", "stock": 15, "seller_id": 1},
    {"name": "Samsung Galaxy Book3 Pro", "price": 1549, "category": "laptop", "image_url": "https://loremflickr.com/600/600/laptop,samsung", "description": "Seamless integration with the Samsung ecosystem", "stock": 12, "seller_id": 1},

    # 📱 MOBILE PHONES (20)
    {"name": "iPhone 15 Pro Max", "price": 1199, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,iphone", "description": "Titanium design with A17 Pro chip and 5x optical zoom", "stock": 25, "seller_id": 1},
    {"name": "iPhone 15", "price": 799, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,apple", "description": "Dynamic Island and 48MP main camera", "stock": 40, "seller_id": 1},
    {"name": "Samsung Galaxy S24 Ultra", "price": 1299, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,samsung", "description": "AI-powered flagship with built-in S Pen", "stock": 20, "seller_id": 1},
    {"name": "Samsung Galaxy S24", "price": 799, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,samsung", "description": "Compact flagship with Galaxy AI features", "stock": 30, "seller_id": 1},
    {"name": "Google Pixel 8 Pro", "price": 999, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,pixel", "description": "The best of Google AI with an incredible camera system", "stock": 22, "seller_id": 1},
    {"name": "Google Pixel 8", "price": 699, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,google", "description": "Helpful AI features in a perfectly sized design", "stock": 28, "seller_id": 1},
    {"name": "Samsung Galaxy Z Fold 5", "price": 1799, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,fold", "description": "Premium foldable for ultimate multitasking", "stock": 10, "seller_id": 1},
    {"name": "Samsung Galaxy Z Flip 5", "price": 999, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,flip", "description": "Stylish pocket-sized foldable with large cover screen", "stock": 18, "seller_id": 1},
    {"name": "OnePlus 12", "price": 799, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,oneplus", "description": "Fast and smooth performance with Hasselblad cameras", "stock": 24, "seller_id": 1},
    {"name": "OnePlus 11R", "price": 499, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,android", "description": "Flagship killer performance at a highly competitive price", "stock": 35, "seller_id": 1},
    {"name": "Xiaomi 14 Pro", "price": 899, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,xiaomi", "description": "Leica co-engineered camera system and HyperOS", "stock": 15, "seller_id": 1},
    {"name": "Sony Xperia 1 V", "price": 1199, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,sony", "description": "Pro-level photography and 4K OLED display", "stock": 8, "seller_id": 1},
    {"name": "ASUS ROG Phone 8 Pro", "price": 1099, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,gaming", "description": "The ultimate gaming smartphone with cooling triggers", "stock": 12, "seller_id": 1},
    {"name": "Nothing Phone (2)", "price": 599, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,nothing", "description": "Unique transparent design with Glyph Interface", "stock": 26, "seller_id": 1},
    {"name": "Motorola Edge Plus", "price": 799, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,motorola", "description": "Sleek curved display with massive battery life", "stock": 16, "seller_id": 1},
    {"name": "Poco F5", "price": 399, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,poco", "description": "Incredible gaming performance on a budget", "stock": 45, "seller_id": 1},
    {"name": "Vivo X100 Pro", "price": 949, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,vivo", "description": "Zeiss optics for exceptional low-light photography", "stock": 14, "seller_id": 1},
    {"name": "Google Pixel 7a", "price": 499, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,pixel", "description": "Flagship camera quality in a mid-range package", "stock": 38, "seller_id": 1},
    {"name": "Realme GT 5", "price": 450, "category": "mobile", "image_url": "https://loremflickr.com/600/600/smartphone,realme", "description": "Blazing fast charging and snapdragon performance", "stock": 32, "seller_id": 1},
    {"name": "iPhone 13", "price": 599, "category": "mobile", "image_url": "https://loremflickr.com/600/600/phone,ios", "description": "Excellent entry-point into the Apple ecosystem", "stock": 50, "seller_id": 1},

    # 👗 FASHION (20)
    {"name": "Men's Tailored Navy Suit", "price": 350, "category": "fashion", "image_url": "https://loremflickr.com/600/600/suit,mens", "description": "Classic two-piece slim-fit navy suit", "stock": 15, "seller_id": 1},
    {"name": "Silk Evening Gown", "price": 420, "category": "fashion", "image_url": "https://loremflickr.com/600/600/gown,evening", "description": "Elegant floor-length silk dress for formal events", "stock": 8, "seller_id": 1},
    {"name": "Leather Biker Jacket", "price": 250, "category": "fashion", "image_url": "https://loremflickr.com/600/600/jacket,leather", "description": "Genuine leather motorcycle jacket with metal hardware", "stock": 12, "seller_id": 1},
    {"name": "Cashmere Trench Coat", "price": 550, "category": "fashion", "image_url": "https://loremflickr.com/600/600/coat,trench", "description": "Luxurious winter coat with waist-tie detailing", "stock": 10, "seller_id": 1},
    {"name": "Pleated Midi Skirt", "price": 85, "category": "fashion", "image_url": "https://loremflickr.com/600/600/skirt,pleated", "description": "Flowy high-waisted skirt for versatile styling", "stock": 25, "seller_id": 1},
    {"name": "Crisp White Dress Shirt", "price": 60, "category": "fashion", "image_url": "https://loremflickr.com/600/600/shirt,white", "description": "Wrinkle-resistant cotton shirt for the office", "stock": 40, "seller_id": 1},
    {"name": "Floral Summer Sundress", "price": 75, "category": "fashion", "image_url": "https://loremflickr.com/600/600/dress,summer", "description": "Lightweight breathable dress with floral prints", "stock": 30, "seller_id": 1},
    {"name": "Wool Blend Overcoat", "price": 280, "category": "fashion", "image_url": "https://loremflickr.com/600/600/overcoat,wool", "description": "Warm, structured overcoat for cold commutes", "stock": 14, "seller_id": 1},
    {"name": "Wide-Leg Linen Trousers", "price": 95, "category": "fashion", "image_url": "https://loremflickr.com/600/600/trousers,linen", "description": "Comfortable, breezy pants for warm weather", "stock": 22, "seller_id": 1},
    {"name": "Cashmere Turtleneck Sweater", "price": 150, "category": "fashion", "image_url": "https://loremflickr.com/600/600/sweater,turtleneck", "description": "Soft and incredibly warm premium knitwear", "stock": 18, "seller_id": 1},
    {"name": "Velvet Dinner Blazer", "price": 190, "category": "fashion", "image_url": "https://loremflickr.com/600/600/blazer,velvet", "description": "Statement blazer for holiday parties and galas", "stock": 9, "seller_id": 1},
    {"name": "Chiffon Ruffle Blouse", "price": 55, "category": "fashion", "image_url": "https://loremflickr.com/600/600/blouse,chiffon", "description": "Delicate semi-sheer top with ruffle details", "stock": 26, "seller_id": 1},
    {"name": "Designer Silk Scarf", "price": 120, "category": "fashion", "image_url": "https://loremflickr.com/600/600/scarf,silk", "description": "Vibrantly patterned accessory for neck or bag", "stock": 35, "seller_id": 1},
    {"name": "Satin Slip Dress", "price": 110, "category": "fashion", "image_url": "https://loremflickr.com/600/600/dress,satin", "description": "Sleek 90s-inspired minimalist evening wear", "stock": 16, "seller_id": 1},
    {"name": "Corduroy Straight Pants", "price": 70, "category": "fashion", "image_url": "https://loremflickr.com/600/600/pants,corduroy", "description": "Textured casual trousers for autumn styling", "stock": 20, "seller_id": 1},
    {"name": "Tuxedo Jacket", "price": 300, "category": "fashion", "image_url": "https://loremflickr.com/600/600/tuxedo,jacket", "description": "Sharp tailoring with satin lapel details", "stock": 7, "seller_id": 1},
    {"name": "Embroidered Cotton Kurta", "price": 65, "category": "fashion", "image_url": "https://loremflickr.com/600/600/kurta,embroidery", "description": "Traditional wear with intricate thread work", "stock": 28, "seller_id": 1},
    {"name": "Denim Maxi Skirt", "price": 80, "category": "fashion", "image_url": "https://loremflickr.com/600/600/skirt,denim", "description": "Trendy longline denim skirt with front slit", "stock": 24, "seller_id": 1},
    {"name": "Chunky Knit Cardigan", "price": 90, "category": "fashion", "image_url": "https://loremflickr.com/600/600/cardigan,knit", "description": "Oversized cozy layering piece", "stock": 30, "seller_id": 1},
    {"name": "Faux Fur Coat", "price": 160, "category": "fashion", "image_url": "https://loremflickr.com/600/600/coat,fur", "description": "Glamorous and warm statement outerwear", "stock": 11, "seller_id": 1},
]

# Insert into DB
for p in products:
    db.add(Product(**p))

db.commit()
print("✅Products inserted successfully!")