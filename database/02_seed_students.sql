-- Yash Kumar (ID: 536899e9-25e8-4d47-8188-ec833a17f638)
INSERT INTO student_ai_profiles 
(student_id, tenth_percentage, twelfth_percentage, internships_count, experience_months, certificates_names, extracted_skills, extracted_technologies, extracted_keywords, ai_tags, experience_level, resume_summary) 
VALUES 
('536899e9-25e8-4d47-8188-ec833a17f638', 91.2, 87.4, 1, 2, ARRAY['AWS Certified Cloud Practitioner', 'Machine Learning Specialization'], ARRAY['Python', 'Problem Solving'], ARRAY['AWS'], ARRAY['Cloud', 'Machine Learning'], ARRAY['intern', 'aws', 'ml', 'python'], 'intern', 'Dean’s List recipient with Gold Badge in Python on HackerRank and Knight ranking on LeetCode. Practical software development experience with TechNova Solutions.') 
ON CONFLICT (student_id) DO UPDATE SET tenth_percentage = EXCLUDED.tenth_percentage, twelfth_percentage = EXCLUDED.twelfth_percentage, internships_count = EXCLUDED.internships_count, experience_months = EXCLUDED.experience_months, certificates_names = EXCLUDED.certificates_names;

-- Yash Tyagi (ID: 8cabc5cf-9c5a-4343-b237-fc1f74e94460)
INSERT INTO student_ai_profiles 
(student_id, tenth_percentage, twelfth_percentage, internships_count, experience_months, certificates_names, extracted_skills, extracted_technologies, extracted_keywords, ai_tags, experience_level, resume_summary) 
VALUES 
('8cabc5cf-9c5a-4343-b237-fc1f74e94460', 88.0, 82.8, 1, 2, ARRAY['AWS Certified Solutions Architect', 'Certified Kubernetes Application Developer (CKAD)', 'HashiCorp Certified: Terraform Associate'], ARRAY['DevOps', 'Penetration Testing'], ARRAY['AWS', 'Kubernetes', 'Terraform'], ARRAY['Cloud', 'DevOps', 'Cybersecurity'], ARRAY['devops', 'aws', 'kubernetes', 'terraform', 'security'], 'intern', 'Cloud & DevOps Intern with AWS, CKAD, and Terraform certifications. Top 5% on TryHackMe.') 
ON CONFLICT (student_id) DO UPDATE SET tenth_percentage = EXCLUDED.tenth_percentage, twelfth_percentage = EXCLUDED.twelfth_percentage, internships_count = EXCLUDED.internships_count, experience_months = EXCLUDED.experience_months, certificates_names = EXCLUDED.certificates_names;

-- Aakash Srivastava (ID: 9545aee3-9c21-4e45-bbca-f40da16f4866)
INSERT INTO student_ai_profiles 
(student_id, tenth_percentage, twelfth_percentage, internships_count, experience_months, certificates_names, extracted_skills, extracted_technologies, extracted_keywords, ai_tags, experience_level, resume_summary) 
VALUES 
('9545aee3-9c21-4e45-bbca-f40da16f4866', 94.4, 91.0, 1, 2, ARRAY['TensorFlow Developer Certificate', 'Deep Learning Specialization (5 Courses)'], ARRAY['Machine Learning', 'Data Science'], ARRAY['TensorFlow', 'Deep Learning'], ARRAY['Data', 'AI', 'Analytics', 'Kaggle', 'Modeling'], ARRAY['data-science', 'machine-learning', 'tensorflow', 'ai', 'intern'], 'intern', 'Data Science Intern with TensorFlow Developer Certificate. Kaggle Competitions Expert and Notebooks Grandmaster.') 
ON CONFLICT (student_id) DO UPDATE SET tenth_percentage = EXCLUDED.tenth_percentage, twelfth_percentage = EXCLUDED.twelfth_percentage, internships_count = EXCLUDED.internships_count, experience_months = EXCLUDED.experience_months, certificates_names = EXCLUDED.certificates_names;

-- Harsh Kumar (ID: 8ab7a988-6479-4b0b-b659-c925d838d7da)
INSERT INTO student_ai_profiles 
(student_id, tenth_percentage, twelfth_percentage, internships_count, experience_months, certificates_names, extracted_skills, extracted_technologies, extracted_keywords, ai_tags, experience_level, resume_summary) 
VALUES 
('8ab7a988-6479-4b0b-b659-c925d838d7da', 89.8, 84.6, 1, 2, ARRAY['Meta Front-End Developer Professional Certificate', 'MongoDB Associate Developer Certification'], ARRAY['Frontend Development', 'Open Source', 'Competitive Programming'], ARRAY['React', 'MongoDB'], ARRAY['Frontend', 'Web', 'Hackathon'], ARRAY['frontend', 'react', 'mongodb', 'intern'], 'intern', 'Frontend Development Intern with Meta and MongoDB certifications. Bronze medalist at Hack36 and active open-source contributor with 12 merged PRs.') 
ON CONFLICT (student_id) DO UPDATE SET tenth_percentage = EXCLUDED.tenth_percentage, twelfth_percentage = EXCLUDED.twelfth_percentage, internships_count = EXCLUDED.internships_count, experience_months = EXCLUDED.experience_months, certificates_names = EXCLUDED.certificates_names;