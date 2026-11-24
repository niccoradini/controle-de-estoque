ALTER TABLE regional_devices ADD COLUMN stock_state TEXT NOT NULL DEFAULT 'available' CHECK(stock_state IN ('available','incoming','repair'));
CREATE INDEX regional_devices_availability ON regional_devices(status, stock_state, store);
DROP TRIGGER regional_device_created;
DROP TRIGGER regional_device_updated;
CREATE TRIGGER regional_device_created AFTER INSERT ON regional_devices BEGIN
 INSERT INTO regional_movements(device_id,action,to_store,actor,snapshot)
 VALUES(NEW.id,CASE NEW.stock_state WHEN 'incoming' THEN 'A caminho' WHEN 'repair' THEN 'Em reparo' ELSE 'Entrada' END,NEW.store,NEW.actor,json_object('model',NEW.model,'material_code',NEW.material_code,'imei',NEW.imei,'condition',NEW.condition,'status',CASE WHEN NEW.status = 'sold' THEN 'sold' ELSE NEW.stock_state END,'notes',NEW.notes));
END;
CREATE TRIGGER regional_device_updated AFTER UPDATE ON regional_devices BEGIN
 INSERT INTO regional_movements(device_id,action,from_store,to_store,actor,snapshot)
 VALUES(NEW.id,CASE WHEN OLD.status <> NEW.status THEN CASE WHEN NEW.status = 'sold' THEN 'Saída' ELSE 'Retorno' END WHEN OLD.stock_state <> NEW.stock_state THEN CASE NEW.stock_state WHEN 'available' THEN 'Recebimento' WHEN 'incoming' THEN 'A caminho' ELSE 'Envio para reparo' END WHEN OLD.store <> NEW.store THEN 'Transferência' ELSE 'Edição' END,OLD.store,NEW.store,NEW.actor,json_object('model',NEW.model,'material_code',NEW.material_code,'imei',NEW.imei,'condition',NEW.condition,'status',CASE WHEN NEW.status = 'sold' THEN 'sold' ELSE NEW.stock_state END,'notes',NEW.notes));
END;
