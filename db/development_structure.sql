CREATE TABLE `articles` (
  `id` int(11) NOT NULL auto_increment,
  `content` text,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

CREATE TABLE `edges` (
  `id` int(11) NOT NULL auto_increment,
  `source_id` int(11) default NULL,
  `target_id` int(11) default NULL,
  `directed` tinyint(1) default NULL,
  `name` varchar(255) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `graphs` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(255) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

CREATE TABLE `graphs_notes` (
  `graph_id` int(11) default NULL,
  `note_id` int(11) default NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `notes` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(255) default NULL,
  `x` int(11) default NULL,
  `y` int(11) default NULL,
  `width` int(11) default NULL,
  `height` int(11) default NULL,
  `color` varchar(255) default NULL,
  `article_id` int(11) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

CREATE TABLE `schema_migrations` (
  `version` varchar(255) NOT NULL,
  UNIQUE KEY `unique_schema_migrations` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `users` (
  `id` int(11) NOT NULL auto_increment,
  `login` varchar(255) default NULL,
  `email` varchar(255) default NULL,
  `crypted_password` varchar(40) default NULL,
  `salt` varchar(40) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  `remember_token` varchar(255) default NULL,
  `remember_token_expires_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

INSERT INTO schema_migrations (version) VALUES ('20081205063512');

INSERT INTO schema_migrations (version) VALUES ('20081205063651');

INSERT INTO schema_migrations (version) VALUES ('20081205063746');

INSERT INTO schema_migrations (version) VALUES ('20081205063821');

INSERT INTO schema_migrations (version) VALUES ('20081205064406');

INSERT INTO schema_migrations (version) VALUES ('20081205102339');