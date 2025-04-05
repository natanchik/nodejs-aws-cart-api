CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'ORDERED'))
);

CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    count INT NOT NULL CHECK (count > 0)
);

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

INSERT INTO carts (id, user_id, status) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002', 'OPEN'),
    ('123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174002', 'OPEN'),
    ('123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174003', 'OPEN'),
    ('123e4567-e89b-12d3-a456-426614174004', '123e4567-e89b-12d3-a456-426614174003', 'OPEN');

INSERT INTO cart_items (cart_id, product_id, count) VALUES
    ('123e4567-e89b-12d3-a456-426614174001', '7567ec4b-b10c-48c5-9345-fc73c48a80a1', 2),
    ('123e4567-e89b-12d3-a456-426614174002', '7567ec4b-b10c-48c5-9345-fc73c48a80a2', 4),
    ('123e4567-e89b-12d3-a456-426614174003', '7567ec4b-b10c-48c5-9345-fc73c48a80a3', 5),
    ('123e4567-e89b-12d3-a456-426614174004', '7567ec4b-b10c-48c5-9345-fc73c48a80a4', 6);