-- Price-drop support and pollution/emission norm on cars.
--   original_price: the previous (higher) price. When set and greater than
--                   `price`, the site shows the old price struck through, the
--                   new price highlighted, and a "Reducere" discount label.
--   emission_norm:  pollution level, e.g. "Euro 6" (Norma de poluare), shown
--                   in the car specifications.
ALTER TABLE cars ADD COLUMN original_price INTEGER;
ALTER TABLE cars ADD COLUMN emission_norm  TEXT;
