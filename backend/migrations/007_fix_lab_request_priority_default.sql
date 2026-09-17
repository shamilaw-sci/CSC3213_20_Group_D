/**
 * @file 007_fix_lab_request_priority_default.sql
 * @module Migrations
 * @desc Aligns lab request priority defaults with the existing constraint.
 * @author Care4U Team
 */

ALTER TABLE lab_test_requests
  ALTER COLUMN priority SET DEFAULT 'routine';
