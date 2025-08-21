-- Add financial fields to business_event_talent table for per diem and guarantee amounts
ALTER TABLE business_event_talent 
ADD COLUMN per_diem_amount DECIMAL(10,2),
ADD COLUMN guarantee_amount DECIMAL(10,2),
ADD COLUMN per_diem_currency TEXT DEFAULT 'USD',
ADD COLUMN guarantee_currency TEXT DEFAULT 'USD';

-- Add daily schedule support to business_events table
ALTER TABLE business_events 
ADD COLUMN daily_schedule JSONB DEFAULT '[]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN business_event_talent.per_diem_amount IS 'Daily per diem allowance amount';
COMMENT ON COLUMN business_event_talent.guarantee_amount IS 'Total guaranteed income for the event';
COMMENT ON COLUMN business_events.daily_schedule IS 'Array of daily schedules with start/end times for multi-day events';