-- Update existing profiles to be your test friends (with correct IDs)
UPDATE public.profiles 
SET username = 'samir', display_name = 'Samir', bettor_level = 'Pro'
WHERE user_id = 'de316ea8-246a-4ce8-a6c6-e29e8a960d36';

UPDATE public.profiles 
SET username = 'george', display_name = 'George', bettor_level = 'Expert'
WHERE user_id = '0fcb5b58-fd3d-4a9a-a505-2f580b845411';

-- Create friendships with your account (ca6fd84e-a5cf-4dd6-8d97-3f47ad71fef1)
INSERT INTO public.friendships (user1_id, user2_id)
VALUES 
  (
    LEAST('ca6fd84e-a5cf-4dd6-8d97-3f47ad71fef1'::uuid, 'de316ea8-246a-4ce8-a6c6-e29e8a960d36'::uuid),
    GREATEST('ca6fd84e-a5cf-4dd6-8d97-3f47ad71fef1'::uuid, 'de316ea8-246a-4ce8-a6c6-e29e8a960d36'::uuid)
  ),
  (
    LEAST('ca6fd84e-a5cf-4dd6-8d97-3f47ad71fef1'::uuid, '0fcb5b58-fd3d-4a9a-a505-2f580b845411'::uuid),
    GREATEST('ca6fd84e-a5cf-4dd6-8d97-3f47ad71fef1'::uuid, '0fcb5b58-fd3d-4a9a-a505-2f580b845411'::uuid)
  )
ON CONFLICT (user1_id, user2_id) DO NOTHING;