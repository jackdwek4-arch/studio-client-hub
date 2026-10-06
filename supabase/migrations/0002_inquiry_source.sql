-- ============================================================
-- Inquiry source: tells website-form leads from booking-form leads.
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run
-- ============================================================

alter table inquiries
  add column source text not null default 'booking_form'
  check (source in ('booking_form', 'website'));

-- RLS: the existing "own inquiries" policy already covers this column.
