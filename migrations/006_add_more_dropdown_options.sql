-- Add more Facility Types
INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES
('facility', 'projector', 'Projector / Smart Board', 'font-bold', 6),
('facility', 'plumbing', 'Plumbing / Restroom', 'font-bold', 7),
('facility', 'security', 'Door / Window / Lock', 'font-bold', 8),
('facility', 'cleaning', 'Cleaning / Janitorial', 'font-bold', 9),
('facility', 'ap', 'Network / Wi-Fi Access Point', 'font-bold', 10);

-- Add more Damage Types
INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES
('damage_type', 'water', 'Water Leak / Flooding', 'font-bold text-cyan-600', 6),
('damage_type', 'overheating', 'Overheating / Fire Hazard', 'font-bold text-orange-600', 7),
('damage_type', 'missing', 'Missing / Stolen Item', 'font-bold text-gray-500', 8),
('damage_type', 'vandalism', 'Vandalism / Intentional Damage', 'font-bold text-purple-700', 9),
('damage_type', 'wear', 'General Wear and Tear', 'font-bold text-amber-600', 10),
('damage_type', 'cosmetic', 'Cosmetic Damage', 'font-bold text-pink-600', 11);

-- Add more Urgency Levels
INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES
('urgency', 'routine', 'Routine / Maintenance', 'font-bold text-slate-500', 0),
('urgency', 'severe', 'Severe (Immediate Danger)', 'font-bold text-rose-700', 5);
