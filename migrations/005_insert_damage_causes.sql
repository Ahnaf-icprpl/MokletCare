DELETE FROM dropdown_options WHERE category = 'damage_cause';
INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES 
('damage_cause', 'i_damaged_it', 'I damaged it', 'font-bold', 1), 
('damage_cause', 'saw_somebody', 'I saw somebody do it', 'font-bold', 2), 
('damage_cause', 'found_broken', 'I found it already broken', 'font-bold', 3), 
('damage_cause', 'broke_itself', 'It broke by itself', 'font-bold', 4);
