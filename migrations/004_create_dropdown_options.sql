CREATE TABLE dropdown_options (id SERIAL PRIMARY KEY, category VARCHAR(50) NOT NULL, value VARCHAR(50) NOT NULL, label VARCHAR(100) NOT NULL, css_class VARCHAR(100) DEFAULT '', sort_order INT DEFAULT 0);
INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES
('facility', 'computer', 'Computer / IT Equipment', 'font-bold', 1),
('facility', 'furniture', 'Desk / Chair / Furniture', 'font-bold', 2),
('facility', 'electrical', 'Electrical / Lighting', 'font-bold', 3),
('facility', 'ac', 'Air Conditioning (AC)', 'font-bold', 4),
('facility', 'other', 'Other', 'font-bold', 5),
('damage_type', 'physical', 'Physical Damage', 'font-bold text-red-600', 1),
('damage_type', 'software', 'Software Issue', 'font-bold text-blue-600', 2),
('damage_type', 'electrical', 'Electrical / Power', 'font-bold text-yellow-600', 3),
('damage_type', 'network', 'Network / Connectivity', 'font-bold text-purple-600', 4),
('damage_type', 'other', 'Other', 'font-bold text-slate-700', 5),
('urgency', 'low', 'Low (Not blocking)', 'font-bold', 1),
('urgency', 'medium', 'Medium (Needs attention soon)', 'font-bold', 2),
('urgency', 'high', 'High (Blocking activities)', 'text-orange-500 font-bold', 3),
('urgency', 'critical', 'Critical (Safety hazard)', 'text-red-600 font-bold', 4);
