CREATE TABLE admin_group (
	id varchar(50) PRIMARY KEY NOT NULL,
	name varchar(50) NOT NULL,
	owner_id varchar(50) NULL references admin_group(id)
);

INSERT INTO admin_group (id, name, owner_id) VALUES ('1', 'Head Admin', NULL);
INSERT INTO admin_group (id, name, owner_id) VALUES ('2', 'Division Admin', '1');
INSERT INTO admin_group (id, name, owner_id) VALUES ('3', 'Development Admin', '1');

ALTER TABLE admin
	ADD COLUMN group_id varchar(50) NOT NULL DEFAULT '2' REFERENCES admin_group(id);

ALTER TABLE admin
	ADD COLUMN division_id varchar(50) NULL REFERENCES division(id);