INSERT INTO public.jobs (
    id, role, company, title, description, job_type, work_mode, ctc, stipend,
    location, min_cgpa, max_backlogs, allowed_branches, allowed_years,
    application_deadline, num_rounds, interview_process, required_skills, tech_stack, status
) VALUES 
('11111111-1111-4111-8111-111111111111', 'Software Engineer', 'Google', 'Software Engineer', 'Building cloud infrastructure.', 'full-time', 'Hybrid', 25.0, 0,
    '{"Bangalore", "Hyderabad"}', 8.0, 0, '{"CSE", "IT"}', '{2026}', '2026-06-01T00:00:00Z', 4, '1. OA\n2. DSA\n3. System Design\n4. Googliness', '{"Algorithms", "System Design"}', '{"C++", "Go", "Python"}', 'active'),

('22222222-2222-4222-8222-222222222222', 'SDE-1', 'Amazon', 'SDE-1', 'Amazon Retail team.', 'full-time', 'On-site', 20.0, 0,
    '{"Bangalore", "Delhi"}', 7.5, 1, '{"CSE", "IT", "ECE"}', '{2026}', '2026-05-15T00:00:00Z', 4, '1. OA\n2. Tech 1\n3. Tech 2\n4. Bar Raiser', '{"DSA", "Problem Solving"}', '{"Java", "AWS"}', 'active'),

('33333333-3333-4333-8333-333333333333', 'SDE Intern', 'Microsoft', 'Software Engineer Intern', 'Summer intern matching to Azure or Office teams.', 'internship', 'Hybrid', null, 80000,
    '{"Hyderabad", "Noida"}', 7.0, 1, '{"CSE", "IT", "ECE"}', '{2027}', '2026-04-30T00:00:00Z', 3, '1. OA\n2. Tech\n3. Tech+HR', '{"DSA"}', '{"C#", ".NET"}', 'active'),

('44444444-4444-4444-8444-444444444444', 'Specialist Programmer', 'Infosys', 'Specialist Programmer', 'High-complexity programming unit.', 'full-time', 'On-site', 9.5, 0,
    '{"Pune", "Bangalore"}', 7.0, 2, '{"CSE", "IT", "ECE", "EE"}', '{2026}', '2026-05-10T00:00:00Z', 2, '1. HackWithInfy/OA\n2. Technical/HR', '{"Programming", "Databases"}', '{"Java", "Python", "SQL"}', 'active'),

('55555555-5555-4555-8555-555555555555', 'Software Engineer', 'Atlassian', 'Software Engineer', 'Tools that unleash the potential in every team.', 'full-time', 'Remote', 32.0, 0,
    '{"Remote"}', 8.5, 0, '{"CSE", "IT"}', '{2026}', '2026-06-15T00:00:00Z', 5, '1. OA\n2. Machine Coding\n3. System Design\n4. Management\n5. Values', '{"System Design", "API"}', '{"Java", "React"}', 'active'),

('66666666-6666-4666-8666-666666666666', 'Analyst', 'Deloitte', 'Analyst', 'Consulting practice focused on tech transformation.', 'full-time', 'Hybrid', 7.6, 0,
    '{"Gurugram", "Bangalore"}', 6.5, 0, '{"CSE", "IT", "ECE", "EE", "ME"}', '{2026}', '2026-05-20T00:00:00Z', 3, '1. Aptitude/Verbal OA\n2. GD\n3. Personal Interview', '{"Communication", "Analytics"}', '{"SQL", "Excel"}', 'active'),

('77777777-7777-4777-8777-777777777777', 'Digital Engineer', 'TCS', 'TCS Digital', 'Digital modernization projects.', 'full-time', 'On-site', 7.0, 0,
    '{"Pan India"}', 7.0, 1, '{"CSE", "IT", "ECE"}', '{2026}', '2026-05-18T00:00:00Z', 2, '1. NQT OA\n2. Technical + HR Interview', '{"Software Dev"}', '{"Java", "React", "Node.js"}', 'active')
ON CONFLICT (id) DO NOTHING;
