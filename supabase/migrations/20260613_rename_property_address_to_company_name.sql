-- Rename leads.property_address to leads.company_name
-- The ADU (construction) lead model used a property address; Mary Portal
-- leads are businesses interested in MARY, so we track company name instead.
alter table public.leads rename column property_address to company_name;
