-- Potato V2 Seed Migration: Believable Restaurants and Menu Items

-- Sample Restaurants
INSERT INTO restaurants (id, name, slug, description, cuisine, image_url, delivery_fee, estimated_delivery_min, estimated_delivery_max, is_active)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'The Rustic Spud', 'the-rustic-spud', 'Artisan hand-smashed potatoes, slow-roasted root bowls, and handcrafted savoury gravies.', 'Artisan Comfort', 'https://images.unsplash.com/photo-1518013034458-30d08553a646?auto=format&fit=crop&w=1200&q=80', 2.99, 20, 35, true),
('a0000000-0000-0000-0000-000000000002', 'Verdant Hearth', 'verdant-hearth', 'Farm-to-table botanical plates, heirloom grains, and fire-kissed seasonal greens.', 'Organic & Clean', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80', 3.49, 25, 40, true),
('a0000000-0000-0000-0000-000000000003', 'Kyoto Craft Noodle & Bento', 'kyoto-craft-noodle', 'Slow-simmered 18-hour tonkotsu & tori paitan, fresh spring noodles, and glazed robata.', 'Japanese Craft', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80', 4.25, 30, 45, true),
('a0000000-0000-0000-0000-000000000004', 'Trattoria Della Nonna', 'trattoria-della-nonna', 'Hand-rolled egg pastas, 72-hour fermented sourdough crusts, and house-made burrata.', 'Italian Osteria', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', 3.99, 25, 40, true),
('a0000000-0000-0000-0000-000000000005', 'Velvet Charcoal Grill', 'velvet-charcoal-grill', 'Oak-smoked Wagyu brisket, char-roasted bone marrow, and rosemary-garlic confit chips.', 'Gourmet Smokehouse', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 4.99, 35, 50, true);

-- Categories for The Rustic Spud
INSERT INTO menu_categories (id, restaurant_id, name, sort_order)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Signature Spud Bowls', 1),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Handcrafted Crisps & Sides', 2),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'House Beverages', 3);

-- Items for The Rustic Spud
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_vegetarian)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Truffle Confit Smash Bowl', 'Crispy smashed Yukon golds, winter truffle butter, shaved pecorino, and wild garden chives.', 16.50, 'https://images.unsplash.com/photo-1518013034458-30d08553a646?auto=format&fit=crop&w=800&q=80', true, true),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Braised Short Rib Hearth Potato', 'Smoked butter-roasted Russet loaded with 12-hour braised beef short rib, rich demi-glace, and sour cream.', 21.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', true, false),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Herb Sea Salt Potato Croquettes', 'Panko-crusted Idaho mash with gruyère center, paired with roasted garlic aioli.', 9.50, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80', true, true),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Sparkling Yuzu Thyme Lemonade', 'Cold-pressed yuzu, fresh lemon juice, wild garden thyme syrup, and botanical soda.', 5.50, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', true, true);

-- Categories & Items for Verdant Hearth
INSERT INTO menu_categories (id, restaurant_id, name, sort_order)
VALUES
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Heirloom Salads & Warm Bowls', 1),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Cold Pressed Elixirs', 2);

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_vegetarian)
VALUES
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Charred Broccolini & Ancient Grains', 'Spelt and farro pilaf, charred broccolini, tahini green goddess, crispy shallots, and crushed marcona almonds.', 17.50, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', true, true),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Wild Chanterelle Warm Polenta', 'Creamy stoneground polenta, pan-roasted wild forest mushrooms, thyme butter, and soft poached farm egg.', 19.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', true, true);

-- Categories & Items for Kyoto Craft Noodle
INSERT INTO menu_categories (id, restaurant_id, name, sort_order)
VALUES
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Handmade Ramen', 1),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Small Plates', 2);

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_vegetarian)
VALUES
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'Black Garlic Kuro Tonkotsu', '18-hour pork broth, charred black garlic oil, torch-seared chashu, ajitsuke tamago, and spring scallions.', 18.50, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', true, false),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 'Crispy Wagyu Gyoza (5 pcs)', 'Pan-crisped dumplings filled with ground Wagyu, napa cabbage, shiitake, and chili-ponzu dip.', 11.50, 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80', true, false);

-- Categories & Items for Trattoria Della Nonna
INSERT INTO menu_categories (id, restaurant_id, name, sort_order)
VALUES
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'Primi Piatti (Pasta)', 1),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'Antipasti', 2);

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_vegetarian)
VALUES
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000008', 'Pappardelle al Cinghiale', 'Wide ribbon pasta tossed with slow-braised wild boar ragù, San Marzano tomatoes, and aged Parmigiano Reggiano.', 22.00, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', true, false),
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000009', 'Pugliese Burrata & Charred Peaches', 'Creamy Pugliese burrata, grilled white peaches, aged Modena balsamic glaze, and torn mint.', 15.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80', true, true);
