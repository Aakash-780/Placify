-- Base Student Profiles Seed
INSERT INTO public.students (id, user_id, name, email, phone, branch, current_year, graduation_year, cgpa, backlogs, placement_status) VALUES
('536899e9-25e8-4d47-8188-ec833a17f638', 'user-yash-kumar', 'Yash Kumar', 'munnu123sng@gmail.com', '9871234560', 'CSE', 3, 2027, 10.0, 0, 'not_placed'),
('8cabc5cf-9c5a-4343-b237-fc1f74e94460', 'user-yash-tyagi', 'Yash Tyagi', 'yash.tyagi@gmail.com', '9871234561', 'CSE', 3, 2027, 8.5, 0, 'not_placed'),
('9545aee3-9c21-4e45-bbca-f40da16f4866', 'user-aakash', 'Aakash Srivastava', 'sahilsrivastava8962@gmail.com', '9871234562', 'CSE', 3, 2027, 9.2, 0, 'not_placed'),
('8ab7a988-6479-4b0b-b659-c925d838d7da', 'user-harsh', 'Harsh Kumar', 'harsh.kumar@gmail.com', '9871234563', 'CSE', 3, 2027, 8.8, 0, 'not_placed')
ON CONFLICT (id) DO NOTHING;
