ALTER TABLE reports ADD COLUMN item_type VARCHAR(100) NOT NULL DEFAULT '';

INSERT INTO dropdown_options (category, value, label, css_class, sort_order) VALUES
('item', 'pc', 'PC / Computer', 'font-bold text-slate-700', 1),
('item', 'monitor', 'Monitor', 'font-bold text-slate-700', 2),
('item', 'mouse_keyboard', 'Mouse / Keyboard', 'font-bold text-slate-700', 3),
('item', 'desk', 'Desk / Table', 'font-bold text-slate-700', 4),
('item', 'chair', 'Chair', 'font-bold text-slate-700', 5),
('item', 'ac_unit', 'AC Unit', 'font-bold text-slate-700', 6),
('item', 'light', 'Light Fixture', 'font-bold text-slate-700', 7),
('item', 'door', 'Door / Handle', 'font-bold text-slate-700', 8),
('item', 'window', 'Window / Glass', 'font-bold text-slate-700', 9),
('item', 'other', 'Other', 'font-bold text-slate-700', 10);
