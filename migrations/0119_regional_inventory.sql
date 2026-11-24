-- Independent shared regional stock; existing store inventory is preserved.
CREATE TABLE regional_devices (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 store TEXT NOT NULL CHECK(store IN ('210h','209h','120h','89MN','283h')),
 model TEXT NOT NULL,
 material_code TEXT NOT NULL,
 imei TEXT NOT NULL UNIQUE CHECK(length(imei) = 15 AND imei NOT GLOB '*[^0-9]*'),
 condition TEXT NOT NULL CHECK(condition IN ('Novo','Vitrine','Renova')),
 status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','sold')),
 notes TEXT NOT NULL DEFAULT '',
 actor TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX regional_devices_store_status ON regional_devices(store, status);
CREATE INDEX regional_devices_code ON regional_devices(material_code);
CREATE TABLE regional_movements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 device_id INTEGER NOT NULL REFERENCES regional_devices(id),
 action TEXT NOT NULL,
 from_store TEXT,
 to_store TEXT NOT NULL,
 actor TEXT NOT NULL,
 snapshot TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX regional_movements_device ON regional_movements(device_id, id);
CREATE TRIGGER regional_device_created AFTER INSERT ON regional_devices BEGIN
 INSERT INTO regional_movements(device_id,action,to_store,actor,snapshot)
 VALUES(NEW.id,'Entrada',NEW.store,NEW.actor,json_object('model',NEW.model,'material_code',NEW.material_code,'imei',NEW.imei,'condition',NEW.condition,'status',NEW.status,'notes',NEW.notes));
END;
CREATE TRIGGER regional_device_updated AFTER UPDATE ON regional_devices BEGIN
 INSERT INTO regional_movements(device_id,action,from_store,to_store,actor,snapshot)
 VALUES(NEW.id,CASE WHEN OLD.status <> NEW.status THEN CASE WHEN NEW.status = 'sold' THEN 'Saída' ELSE 'Retorno' END WHEN OLD.store <> NEW.store THEN 'Transferência' ELSE 'Edição' END,OLD.store,NEW.store,NEW.actor,json_object('model',NEW.model,'material_code',NEW.material_code,'imei',NEW.imei,'condition',NEW.condition,'status',NEW.status,'notes',NEW.notes));
END;
