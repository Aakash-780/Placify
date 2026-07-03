INSERT INTO job_applications (student_id, job_id, status) VALUES
('536899e9-25e8-4d47-8188-ec833a17f638', '052911a9-869a-427c-8096-0c5393082d98', 'pending'),
('8cabc5cf-9c5a-4343-b237-fc1f74e94460', '052911a9-869a-427c-8096-0c5393082d98', 'shortlisted'),
('9545aee3-9c21-4e45-bbca-f40da16f4866', 'a6927616-582e-46b4-9dac-9c36f53f8a01', 'pending'),
('8ab7a988-6479-4b0b-b659-c925d838d7da', 'd96289a4-0752-439b-88fb-ed0c003e1725', 'rejected'),
('536899e9-25e8-4d47-8188-ec833a17f638', '3e099c06-a5a9-4766-8395-7a5d8027930a', 'accepted'),
('8cabc5cf-9c5a-4343-b237-fc1f74e94460', '3e099c06-a5a9-4766-8395-7a5d8027930a', 'pending'),
('9545aee3-9c21-4e45-bbca-f40da16f4866', '3e099c06-a5a9-4766-8395-7a5d8027930a', 'shortlisted'),
('8ab7a988-6479-4b0b-b659-c925d838d7da', '3e099c06-a5a9-4766-8395-7a5d8027930a', 'pending'),
('536899e9-25e8-4d47-8188-ec833a17f638', 'a6927616-582e-46b4-9dac-9c36f53f8a01', 'shortlisted'),
('8cabc5cf-9c5a-4343-b237-fc1f74e94460', 'd96289a4-0752-439b-88fb-ed0c003e1725', 'pending')
ON CONFLICT DO NOTHING;
