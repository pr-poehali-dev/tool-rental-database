CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    period VARCHAR(50) NOT NULL DEFAULT 'сутки',
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    image TEXT,
    specs JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    equipment_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_company VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    total INTEGER NOT NULL,
    contract_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    inn VARCHAR(20) NOT NULL UNIQUE,
    kpp VARCHAR(20),
    legal_address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    correspondent_account VARCHAR(50),
    bik VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dates ON orders(start_date, end_date);
CREATE INDEX idx_clients_inn ON clients(inn);

INSERT INTO equipment (name, category, price, period, status, image, specs) VALUES
('Перфоратор Bosch GBH 2-28', 'Электроинструмент', 800, 'сутки', 'available', 
 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
 '["Мощность 880 Вт", "SDS-plus", "Вес 3.2 кг"]'::jsonb),
('Бетономешалка 180л', 'Строительное оборудование', 1200, 'сутки', 'available',
 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
 '["Объём 180л", "220В", "Производительность 2.5 м³/ч"]'::jsonb),
('Строительный лазерный нивелир', 'Измерительный инструмент', 600, 'сутки', 'available',
 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
 '["Дальность 30м", "Точность ±0.3мм/м", "Автоматическое выравнивание"]'::jsonb),
('Генератор 5 кВт', 'Энергетическое оборудование', 2000, 'сутки', 'available',
 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=400',
 '["Мощность 5 кВт", "Бензиновый", "Время работы 8 ч"]'::jsonb),
('Шлифовальная машина', 'Электроинструмент', 500, 'сутки', 'rented',
 'https://images.unsplash.com/photo-1581092162384-8987c1d64926?w=400',
 '["Диск 230мм", "Мощность 2000 Вт", "Регулировка оборотов"]'::jsonb),
('Виброплита 100 кг', 'Строительное оборудование', 1500, 'сутки', 'available',
 'https://images.unsplash.com/photo-1581092583537-20d51876f863?w=400',
 '["Вес 100 кг", "Бензиновая", "Площадь 500 м²/ч"]'::jsonb);

INSERT INTO orders (equipment_id, equipment_name, start_date, end_date, status, total, contract_number) VALUES
(1, 'Перфоратор Bosch GBH 2-28', '2026-01-15', '2026-01-20', 'active', 4000, 'А-2026-001'),
(4, 'Генератор 5 кВт', '2026-01-10', '2026-01-12', 'completed', 4000, 'А-2026-002');

INSERT INTO clients (company_name, inn, kpp, legal_address, contact_person, phone, email, bank_name, account_number, correspondent_account, bik) VALUES
('ООО "Строймонтаж"', '7701234567', '770101001', 'г. Москва, ул. Примерная, д. 1', 
 'Иванов Иван Иванович', '+7 (999) 123-45-67', 'info@stroimontazh.ru',
 'ПАО Сбербанк', '40702810100000000000', '30101810400000000225', '044525225');