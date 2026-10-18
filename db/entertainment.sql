-- Run once after initial app admin configuration.
-- This table holds only APPROVED source metadata; never video/audio files.
CREATE TABLE IF NOT EXISTS entertainment_items (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 kind ENUM('tv','watch','podcast','discover') NOT NULL,
 provider ENUM('youtube','spotify','external','twitch','hls') NOT NULL DEFAULT 'external',
 title VARCHAR(160) NOT NULL,
 summary VARCHAR(450) NOT NULL,
 category VARCHAR(70) NOT NULL DEFAULT 'General',
 country VARCHAR(10) NOT NULL DEFAULT '',
 language VARCHAR(40) NOT NULL DEFAULT '',
 source_name VARCHAR(90) NOT NULL DEFAULT '',
 source_url VARCHAR(1024) NOT NULL,
 external_id VARCHAR(100) NOT NULL DEFAULT '',
 poster_style ENUM('news','space','culture','learning','entertainment') NOT NULL DEFAULT 'learning',
 permission ENUM('official_embed','official_link','licensed_stream') NOT NULL,
 permission_note VARCHAR(500) NOT NULL,
 badge VARCHAR(70) NOT NULL DEFAULT 'Verified source',
 display_order SMALLINT NOT NULL DEFAULT 0,
 status ENUM('draft','published') NOT NULL DEFAULT 'draft',
 checked_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY kind_status (kind,status,display_order),
 KEY latest (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
