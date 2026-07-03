BEGIN;

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def two_sum(nums, target):\n    # Your code here\n    pass\n\n# Uncomment to test:\n# print(two_sum([2,7,11,15], 9))"') WHERE id = '9c1a92c4-d5b8-467d-9493-454ec8d0df19';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function twoSum(nums, target) {\n  // Your code here\n}\n\n// Uncomment to test:\n// console.log(twoSum([2,7,11,15], 9));"') WHERE id = '9c1a92c4-d5b8-467d-9493-454ec8d0df19';

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def reverse_list(head):\n    # Your code here\n    pass\n\n# Note: A ListNode class is required to test locally."') WHERE id = '563ce90d-4c18-45b2-a85d-0e799f0ad34a';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function reverseList(head) {\n  // Your code here\n}\n\n// Note: A ListNode class is required to test locally."') WHERE id = '563ce90d-4c18-45b2-a85d-0e799f0ad34a';

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def length_of_longest_substring(s):\n    # Your code here\n    pass\n\n# Uncomment to test:\n# print(length_of_longest_substring(\"abcabcbb\"))"') WHERE id = 'e22a299d-05a8-4169-93f2-95106f35f2eb';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function lengthOfLongestSubstring(s) {\n  // Your code here\n}\n\n// Uncomment to test:\n// console.log(lengthOfLongestSubstring(\"abcabcbb\"));"') WHERE id = 'e22a299d-05a8-4169-93f2-95106f35f2eb';

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def merge_two_lists(l1, l2):\n    # Your code here\n    pass\n\n# Note: A ListNode class is required to test locally."') WHERE id = '77514fad-bb44-4e3d-8d05-f796a1361bcc';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function mergeTwoLists(l1, l2) {\n  // Your code here\n}\n\n// Note: A ListNode class is required to test locally."') WHERE id = '77514fad-bb44-4e3d-8d05-f796a1361bcc';

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def level_order(root):\n    # Your code here\n    pass\n\n# Note: A TreeNode class is required to test locally."') WHERE id = '27c31a44-f0e1-441d-b7a1-78b1084b4f03';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function levelOrder(root) {\n  // Your code here\n}\n\n// Note: A TreeNode class is required to test locally."') WHERE id = '27c31a44-f0e1-441d-b7a1-78b1084b4f03';

UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{python}', '"def max_sub_array(nums):\n    # Your code here\n    pass\n\n# Uncomment to test:\n# print(max_sub_array([-2,1,-3,4,-1,2,1,-5,4]))"') WHERE id = '34ec28b6-7a61-4531-948f-ae6abc7c3ffc';
UPDATE coding_problems SET starter_code = jsonb_set(starter_code, '{javascript}', '"function maxSubArray(nums) {\n  // Your code here\n}\n\n// Uncomment to test:\n// console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));"') WHERE id = '34ec28b6-7a61-4531-948f-ae6abc7c3ffc';

COMMIT;