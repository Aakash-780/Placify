BEGIN;

-- Update 1. Two Sum
UPDATE coding_problems SET
  description = $desc$Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.$desc$,
  sample_input = $in$nums = [2,7,11,15]
target = 9$in$,
  sample_output = $out$[0,1]$out$,
  constraints = $const$2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};","java":"class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}","python":"class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 1;

-- Update 26. Remove Duplicates from Sorted Array
UPDATE coding_problems SET
  description = $desc$Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in nums.

Consider the number of unique elements of nums to be k, to get accepted, you need to do the following things:
1. Change the array nums such that the first k elements of nums contain the unique elements in the order they were present in nums initially.
2. Return k.$desc$,
  sample_input = $in$nums = [1,1,2]$in$,
  sample_output = $out$2, nums = [1,2,_]$out$,
  constraints = $const$1 <= nums.length <= 3 * 10^4
-100 <= nums[i] <= 100
nums is sorted in non-decreasing order.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int removeDuplicates(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int removeDuplicates(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar removeDuplicates = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 26;

-- Update 27. Remove Element
UPDATE coding_problems SET
  description = $desc$Given an integer array nums and an integer val, remove all occurrences of val in nums in-place. The order of the elements may be changed. Then return the number of elements in nums which are not equal to val.

Consider the number of elements in nums which are not equal to val be k, to get accepted, you need to do the following things:
1. Change the array nums such that the first k elements of nums contain the elements which are not equal to val.
2. Return k.$desc$,
  sample_input = $in$nums = [3,2,2,3], val = 3$in$,
  sample_output = $out$2, nums = [2,2,_,_]$out$,
  constraints = $const$0 <= nums.length <= 100
0 <= nums[i] <= 50
0 <= val <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int removeElement(vector<int>& nums, int val) {\n        \n    }\n};","java":"class Solution {\n    public int removeElement(int[] nums, int val) {\n        \n    }\n}","python":"class Solution:\n    def removeElement(self, nums: List[int], val: int) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} val\n * @return {number}\n */\nvar removeElement = function(nums, val) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 27;

-- Update 35. Search Insert Position
UPDATE coding_problems SET
  description = $desc$Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

You must write an algorithm with O(log n) runtime complexity.$desc$,
  sample_input = $in$nums = [1,3,5,6], target = 5$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= nums.length <= 10^4
-10^4 <= nums[i] <= 10^4
nums contains distinct values sorted in ascending order.
-10^4 <= target <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int searchInsert(vector<int>& nums, int target) {\n        \n    }\n};","java":"class Solution {\n    public int searchInsert(int[] nums, int target) {\n        \n    }\n}","python":"class Solution:\n    def searchInsert(self, nums: List[int], target: int) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar searchInsert = function(nums, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 35;

-- Update 53. Maximum Subarray
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, find the subarray with the largest sum, and return its sum.$desc$,
  sample_input = $in$nums = [-2,1,-3,4,-1,2,1,-5,4]$in$,
  sample_output = $out$6$out$,
  constraints = $const$1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 53;

-- Update 66. Plus One
UPDATE coding_problems SET
  description = $desc$You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's.

Increment the large integer by one and return the resulting array of digits.$desc$,
  sample_input = $in$digits = [1,2,3]$in$,
  sample_output = $out$[1,2,4]$out$,
  constraints = $const$1 <= digits.length <= 100
0 <= digits[i] <= 9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> plusOne(vector<int>& digits) {\n        \n    }\n};","java":"class Solution {\n    public int[] plusOne(int[] digits) {\n        \n    }\n}","python":"class Solution:\n    def plusOne(self, digits: List[int]) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} digits\n * @return {number[]}\n */\nvar plusOne = function(digits) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 66;

-- Update 88. Merge Sorted Array
UPDATE coding_problems SET
  description = $desc$You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.

Merge nums1 and nums2 into a single array sorted in non-decreasing order.

The final sorted array should not be returned by the function, but instead be stored inside the array nums1. To accommodate this, nums1 has a length of m + n, where the first m elements denote the elements that should be merged, and the last n elements are set to 0 and should be ignored. nums2 has a length of n.$desc$,
  sample_input = $in$nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3$in$,
  sample_output = $out$nums1 = [1,2,2,3,5,6]$out$,
  constraints = $const$nums1.length == m + n
nums2.length == n
0 <= m, n <= 200
1 <= m + n <= 200
-10^9 <= nums1[i], nums2[j] <= 10^9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {\n        \n    }\n};","java":"class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        \n    }\n}","python":"class Solution:\n    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n        ","javascript":"/**\n * @param {number[]} nums1\n * @param {number} m\n * @param {number[]} nums2\n * @param {number} n\n * @return {void} Do not return anything, modify nums1 in-place instead.\n */\nvar merge = function(nums1, m, nums2, n) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 88;

-- Update 121. Best Time to Buy and Sell Stock
UPDATE coding_problems SET
  description = $desc$You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.$desc$,
  sample_input = $in$prices = [7,1,5,3,6,4]$in$,
  sample_output = $out$5$out$,
  constraints = $const$1 <= prices.length <= 10^5
0 <= prices[i] <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};","java":"class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}","python":"class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 121;

-- Update 136. Single Number
UPDATE coding_problems SET
  description = $desc$Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.$desc$,
  sample_input = $in$nums = [2,2,1]$in$,
  sample_output = $out$1$out$,
  constraints = $const$1 <= nums.length <= 3 * 10^4
-3 * 10^4 <= nums[i] <= 3 * 10^4
Each element in the array appears twice except for one element.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int singleNumber(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar singleNumber = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 136;

-- Update 169. Majority Element
UPDATE coding_problems SET
  description = $desc$Given an array nums of size n, return the majority element.

The majority element is the element that appears more than floor(n / 2) times. You may assume that the majority element always exists in the array.$desc$,
  sample_input = $in$nums = [3,2,3]$in$,
  sample_output = $out$3$out$,
  constraints = $const$n == nums.length
1 <= n <= 5 * 10^4
-10^9 <= nums[i] <= 10^9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int majorityElement(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 169;

-- Update 217. Contains Duplicate
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.$desc$,
  sample_input = $in$nums = [1,2,3,1]$in$,
  sample_output = $out$true$out$,
  constraints = $const$1 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 217;

-- Update 268. Missing Number
UPDATE coding_problems SET
  description = $desc$Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.$desc$,
  sample_input = $in$nums = [3,0,1]$in$,
  sample_output = $out$2$out$,
  constraints = $const$n == nums.length
1 <= n <= 10^4
0 <= nums[i] <= n
All the numbers of nums are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int missingNumber(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar missingNumber = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 268;

-- Update 283. Move Zeroes
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements.

Note that you must do this in-place without making a copy of the array.$desc$,
  sample_input = $in$nums = [0,1,0,3,12]$in$,
  sample_output = $out$[1,3,12,0,0]$out$,
  constraints = $const$1 <= nums.length <= 10^4
-2^31 <= nums[i] <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public void moveZeroes(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar moveZeroes = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 283;

-- Update 344. Reverse String
UPDATE coding_problems SET
  description = $desc$Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.$desc$,
  sample_input = $in$s = ["h","e","l","l","o"]$in$,
  sample_output = $out$["o","l","l","e","h"]$out$,
  constraints = $const$1 <= s.length <= 10^5
s[i] is a printable ascii character.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};","java":"class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}","python":"class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        ","javascript":"/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 344;

-- Update 125. Valid Palindrome
UPDATE coding_problems SET
  description = $desc$A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.$desc$,
  sample_input = $in$s = "A man, a plan, a canal: Panama"$in$,
  sample_output = $out$true$out$,
  constraints = $const$1 <= s.length <= 2 * 10^5
s consists only of printable ASCII characters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isPalindrome(string s) {\n        \n    }\n};","java":"class Solution {\n    public boolean isPalindrome(String s) {\n        \n    }\n}","python":"class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        ","javascript":"/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 125;

-- Update 242. Valid Anagram
UPDATE coding_problems SET
  description = $desc$Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.$desc$,
  sample_input = $in$s = "anagram", t = "nagaram"$in$,
  sample_output = $out$true$out$,
  constraints = $const$1 <= s.length, t.length <= 5 * 10^4
s and t consist of lowercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};","java":"class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}","python":"class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ","javascript":"/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 242;

-- Update 14. Longest Common Prefix
UPDATE coding_problems SET
  description = $desc$Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".$desc$,
  sample_input = $in$strs = ["flower","flow","flight"]$in$,
  sample_output = $out$"fl"$out$,
  constraints = $const$1 <= strs.length <= 200
0 <= strs[i].length <= 200
strs[i] consists of only lowercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        \n    }\n};","java":"class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        \n    }\n}","python":"class Solution:\n    def longestCommonPrefix(self, strs: List[str]) -> str:\n        ","javascript":"/**\n * @param {string[]} strs\n * @return {string}\n */\nvar longestCommonPrefix = function(strs) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 14;

-- Update 20. Valid Parentheses
UPDATE coding_problems SET
  description = $desc$Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.$desc$,
  sample_input = $in$s = "()"$in$,
  sample_output = $out$true$out$,
  constraints = $const$1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};","java":"class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}","python":"class Solution:\n    def isValid(self, s: str) -> bool:\n        ","javascript":"/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 20;

-- Update 104. Maximum Depth of Binary Tree
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.$desc$,
  sample_input = $in$root = [3,9,20,null,null,15,7]$in$,
  sample_output = $out$3$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 10^4].
-100 <= Node.val <= 100$const$,
  starter_code = $code${"cpp":"/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};","java":"/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\nclass Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}","python":"# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ","javascript":"/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * } \n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 104;

-- Update 100. Same Tree
UPDATE coding_problems SET
  description = $desc$Given the roots of two binary trees p and q, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same values.$desc$,
  sample_input = $in$p = [1,2,3], q = [1,2,3]$in$,
  sample_output = $out$true$out$,
  constraints = $const$The number of nodes in both trees is in the range [0, 100].
-10^4 <= Node.val <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isSameTree(TreeNode* p, TreeNode* q) {\n        \n    }\n};","java":"class Solution {\n    public boolean isSameTree(TreeNode p, TreeNode q) {\n        \n    }\n}","python":"class Solution:\n    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:\n        ","javascript":"/**\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {boolean}\n */\nvar isSameTree = function(p, q) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 100;

-- Update 226. Invert Binary Tree
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, invert the tree, and return its root.$desc$,
  sample_input = $in$root = [4,2,7,1,3,6,9]$in$,
  sample_output = $out$[4,7,2,9,6,3,1]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 100].
-100 <= Node.val <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 226;

-- Update 112. Path Sum
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum.

A leaf is a node with no children.$desc$,
  sample_input = $in$root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22$in$,
  sample_output = $out$true$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 5000].
-1000 <= Node.val <= 1000
-1000 <= targetSum <= 1000$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool hasPathSum(TreeNode* root, int targetSum) {\n        \n    }\n};","java":"class Solution {\n    public boolean hasPathSum(TreeNode root, int targetSum) {\n        \n    }\n}","python":"class Solution:\n    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @param {number} targetSum\n * @return {boolean}\n */\nvar hasPathSum = function(root, targetSum) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 112;

-- Update 206. Reverse Linked List
UPDATE coding_problems SET
  description = $desc$Given the head of a singly linked list, reverse the list, and return the reversed list.$desc$,
  sample_input = $in$head = [1,2,3,4,5]$in$,
  sample_output = $out$[5,4,3,2,1]$out$,
  constraints = $const$The number of nodes in the list is the range [0, 5000].
-5000 <= Node.val <= 5000$const$,
  starter_code = $code${"cpp":"/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};","java":"/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}","python":"# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ","javascript":"/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 206;

-- Update 21. Merge Two Sorted Lists
UPDATE coding_problems SET
  description = $desc$You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists in a single sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.$desc$,
  sample_input = $in$list1 = [1,2,4], list2 = [1,3,4]$in$,
  sample_output = $out$[1,1,2,3,4,4]$out$,
  constraints = $const$The number of nodes in both lists is in the range [0, 50].
-100 <= Node.val <= 100
Both list1 and list2 are sorted in non-decreasing order.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};","java":"class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}","python":"class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ","javascript":"/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 21;

-- Update 141. Linked List Cycle
UPDATE coding_problems SET
  description = $desc$Given head, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer. Internally, pos is used to denote the index of the node that tail's next pointer is connected to. Note that pos is not passed as a parameter.

Return true if there is a cycle in the linked list. Otherwise, return false.$desc$,
  sample_input = $in$head = [3,2,0,-4], pos = 1$in$,
  sample_output = $out$true$out$,
  constraints = $const$The number of nodes in the list is in the range [0, 10^4].
-10^5 <= Node.val <= 10^5$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        \n    }\n};","java":"public class Solution {\n    public boolean hasCycle(ListNode head) {\n        \n    }\n}","python":"class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        ","javascript":"/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar hasCycle = function(head) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 141;

-- Update 160. Intersection of Two Linked Lists
UPDATE coding_problems SET
  description = $desc$Given the heads of two singly linked-lists headA and headB, return the node at which the two lists intersect. If the two linked lists have no intersection at all, return null.$desc$,
  sample_input = $in$intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3$in$,
  sample_output = $out$Intersected at '8'$out$,
  constraints = $const$The number of nodes of listA is m, listB is n.
1 <= m, n <= 3 * 10^4
-10^6 <= Node.val <= 10^6$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {\n        \n    }\n};","java":"public class Solution {\n    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {\n        \n    }\n}","python":"class Solution:\n    def getIntersectionNode(self, headA: ListNode, headB: ListNode) -> Optional[ListNode]:\n        ","javascript":"/**\n * @param {ListNode} headA\n * @param {ListNode} headB\n * @return {ListNode}\n */\nvar getIntersectionNode = function(headA, headB) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 160;

-- Update 232. Implement Queue using Stacks
UPDATE coding_problems SET
  description = $desc$Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support all the functions of a normal queue (push, peek, pop, and empty).$desc$,
  sample_input = $in$["MyQueue", "push", "push", "peek", "pop", "empty"]
[[], [1], [2], [], [], []]$in$,
  sample_output = $out$[null, null, null, 1, 1, false]$out$,
  constraints = $const$1 <= x <= 9
At most 100 calls will be made to push, pop, peek, and empty.$const$,
  starter_code = $code${"cpp":"class MyQueue {\npublic:\n    MyQueue() {\n        \n    }\n    \n    void push(int x) {\n        \n    }\n    \n    int pop() {\n        \n    }\n    \n    int peek() {\n        \n    }\n    \n    bool empty() {\n        \n    }\n};","java":"class MyQueue {\n    public MyQueue() {\n        \n    }\n    \n    public void push(int x) {\n        \n    }\n    \n    public int pop() {\n        \n    }\n    \n    public int peek() {\n        \n    }\n    \n    public boolean empty() {\n        \n    }\n}","python":"class MyQueue:\n    def __init__(self):\n        \n    def push(self, x: int) -> None:\n        \n    def pop(self) -> int:\n        \n    def peek(self) -> int:\n        \n    def empty(self) -> bool:\n        ","javascript":"var MyQueue = function() {\n    \n};\n\nMyQueue.prototype.push = function(x) {\n    \n};\n\nMyQueue.prototype.pop = function() {\n    \n};\n\nMyQueue.prototype.peek = function() {\n    \n};\n\nMyQueue.prototype.empty = function() {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 232;

-- Update 225. Implement Stack using Queues
UPDATE coding_problems SET
  description = $desc$Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).$desc$,
  sample_input = $in$["MyStack", "push", "push", "top", "pop", "empty"]
[[], [1], [2], [], [], []]$in$,
  sample_output = $out$[null, null, null, 2, 2, false]$out$,
  constraints = $const$1 <= x <= 9
At most 100 calls will be made to push, pop, top, and empty.$const$,
  starter_code = $code${"cpp":"class MyStack {\npublic:\n    MyStack() {\n        \n    }\n    \n    void push(int x) {\n        \n    }\n    \n    int pop() {\n        \n    }\n    \n    int top() {\n        \n    }\n    \n    bool empty() {\n        \n    }\n};","java":"class MyStack {\n    public MyStack() {\n        \n    }\n    \n    public void push(int x) {\n        \n    }\n    \n    public int pop() {\n        \n    }\n    \n    public int top() {\n        \n    }\n    \n    public boolean empty() {\n        \n    }\n}","python":"class MyStack:\n    def __init__(self):\n        \n    def push(self, x: int) -> None:\n        \n    def pop(self) -> int:\n        \n    def top(self) -> int:\n        \n    def empty(self) -> bool:\n        ","javascript":"var MyStack = function() {\n    \n};\n\nMyStack.prototype.push = function(x) {\n    \n};\n\nMyStack.prototype.pop = function() {\n    \n};\n\nMyStack.prototype.top = function() {\n    \n};\n\nMyStack.prototype.empty = function() {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 225;

-- Update 70. Climbing Stairs
UPDATE coding_problems SET
  description = $desc$You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?$desc$,
  sample_input = $in$n = 2$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= n <= 45$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};","java":"class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}","python":"class Solution:\n    def climbStairs(self, n: int) -> int:\n        ","javascript":"/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 70;

-- Update 509. Fibonacci Number
UPDATE coding_problems SET
  description = $desc$The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.$desc$,
  sample_input = $in$n = 2$in$,
  sample_output = $out$1$out$,
  constraints = $const$0 <= n <= 30$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int fib(int n) {\n        \n    }\n};","java":"class Solution {\n    public int fib(int n) {\n        \n    }\n}","python":"class Solution:\n    def fib(self, n: int) -> int:\n        ","javascript":"/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 509;

-- Update 3. Longest Substring Without Repeating Characters
UPDATE coding_problems SET
  description = $desc$Given a string s, find the length of the longest substring without repeating characters.$desc$,
  sample_input = $in$s = "abcabcbb"$in$,
  sample_output = $out$3$out$,
  constraints = $const$0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};","java":"class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}","python":"class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ","javascript":"/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 3;

-- Update 11. Container With Most Water
UPDATE coding_problems SET
  description = $desc$You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.$desc$,
  sample_input = $in$height = [1,8,6,2,5,4,8,3,7]$in$,
  sample_output = $out$49$out$,
  constraints = $const$n == height.length
2 <= n <= 10^5
0 <= height[i] <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};","java":"class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}","python":"class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 11;

-- Update 15. 3Sum
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.$desc$,
  sample_input = $in$nums = [-1,0,1,2,-1,-4]$in$,
  sample_output = $out$[[-1,-1,2],[-1,0,1]]$out$,
  constraints = $const$3 <= nums.length <= 3000
-10^5 <= nums[i] <= 10^5$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 15;

-- Update 33. Search in Rotated Sorted Array
UPDATE coding_problems SET
  description = $desc$There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.

You must write an algorithm with O(log n) runtime complexity.$desc$,
  sample_input = $in$nums = [4,5,6,7,0,1,2], target = 0$in$,
  sample_output = $out$4$out$,
  constraints = $const$1 <= nums.length <= 5000
-10^4 <= nums[i] <= 10^4
nums values are unique.
target <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};","java":"class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}","python":"class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 33;

-- Update 34. Find First and Last Position of Element in Sorted Array
UPDATE coding_problems SET
  description = $desc$Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.

If target is not found in the array, return [-1, -1].

You must write an algorithm with O(log n) runtime complexity.$desc$,
  sample_input = $in$nums = [5,7,7,8,8,10], target = 8$in$,
  sample_output = $out$[3,4]$out$,
  constraints = $const$0 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9
nums is non-decreasing.
-10^9 <= target <= 10^9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> searchRange(vector<int>& nums, int target) {\n        \n    }\n};","java":"class Solution {\n    public int[] searchRange(int[] nums, int target) {\n        \n    }\n}","python":"class Solution:\n    def searchRange(self, nums: List[int], target: int) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar searchRange = function(nums, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 34;

-- Update 39. Combination Sum
UPDATE coding_problems SET
  description = $desc$Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order.

The same number may be chosen from candidates an unlimited number of times. Two combinations are unique if the frequency of at least one of the chosen numbers is different.$desc$,
  sample_input = $in$candidates = [2,3,6,7], target = 7$in$,
  sample_output = $out$[[2,2,3],[7]]$out$,
  constraints = $const$1 <= candidates.length <= 30
2 <= candidates[i] <= 40
All elements of candidates are distinct.
1 <= target <= 40$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        \n    }\n}","python":"class Solution:\n    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 39;

-- Update 46. Permutations
UPDATE coding_problems SET
  description = $desc$Given an array nums of distinct integers, return all the possible permutations. You may return the answer in any order.$desc$,
  sample_input = $in$nums = [1,2,3]$in$,
  sample_output = $out$[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]$out$,
  constraints = $const$1 <= nums.length <= 6
-10 <= nums[i] <= 10
All the integers of nums are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 46;

-- Update 49. Group Anagrams
UPDATE coding_problems SET
  description = $desc$Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.$desc$,
  sample_input = $in$strs = ["eat","tea","tan","ate","nat","bat"]$in$,
  sample_output = $out$[["bat"],["nat","tan"],["ate","eat","tea"]]$out$,
  constraints = $const$1 <= strs.length <= 10^4
0 <= strs[i].length <= 100
strs[i] consists of lowercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};","java":"class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}","python":"class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ","javascript":"/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 49;

-- Update 54. Spiral Matrix
UPDATE coding_problems SET
  description = $desc$Given an m x n matrix, return all elements of the matrix in spiral order.$desc$,
  sample_input = $in$matrix = [[1,2,3],[4,5,6],[7,8,9]]$in$,
  sample_output = $out$[1,2,3,6,9,8,7,4,5]$out$,
  constraints = $const$m == matrix.length
n == matrix[i].length
1 <= m, n <= 10
-100 <= matrix[i][j] <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> spiralOrder(vector<vector<int>>& matrix) {\n        \n    }\n};","java":"class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        \n    }\n}","python":"class Solution:\n    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:\n        ","javascript":"/**\n * @param {number[][]} matrix\n * @return {number[]}\n */\nvar spiralOrder = function(matrix) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 54;

-- Update 56. Merge Intervals
UPDATE coding_problems SET
  description = $desc$Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.$desc$,
  sample_input = $in$intervals = [[1,3],[2,6],[8,10],[15,18]]$in$,
  sample_output = $out$[[1,6],[8,10],[15,18]]$out$,
  constraints = $const$1 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= start_i <= end_i <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};","java":"class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}","python":"class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 56;

-- Update 57. Insert Interval
UPDATE coding_problems SET
  description = $desc$You are given an array of non-overlapping intervals intervals where intervals[i] = [start_i, end_i] represent the start and the end of the ith interval and intervals is sorted in ascending order by start_i. You are also given an interval newInterval = [start, end] that represents the start and end of another interval.

Insert newInterval into intervals such that intervals is still sorted in ascending order by start_i and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).

Return intervals after the insertion.$desc$,
  sample_input = $in$intervals = [[1,3],[6,9]], newInterval = [2,5]$in$,
  sample_output = $out$[[1,5],[6,9]]$out$,
  constraints = $const$0 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= start_i <= end_i <= 10^5
intervals is sorted by start_i in ascending order.
newInterval.length == 2
0 <= start <= end <= 10^5$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {\n        \n    }\n};","java":"class Solution {\n    public int[][] insert(int[][] intervals, int[] newInterval) {\n        \n    }\n}","python":"class Solution:\n    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[][]} intervals\n * @param {number[]} newInterval\n * @return {number[][]}\n */\nvar insert = function(intervals, newInterval) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 57;

-- Update 73. Set Matrix Zeroes
UPDATE coding_problems SET
  description = $desc$Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0. Do it in-place.$desc$,
  sample_input = $in$matrix = [[1,1,1],[1,0,1],[1,1,1]]$in$,
  sample_output = $out$1,0,1,0,0,0,1,0,1$out$,
  constraints = $const$m == matrix.length
n == matrix[0].length
1 <= m, n <= 200
-2^31 <= matrix[i][j] <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void setZeroes(vector<vector<int>>& matrix) {\n        \n    }\n};","java":"class Solution {\n    public void setZeroes(int[][] matrix) {\n        \n    }\n}","python":"class Solution:\n    def setZeroes(self, matrix: List[List[int]]) -> None:\n        ","javascript":"/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar setZeroes = function(matrix) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 73;

-- Update 78. Subsets
UPDATE coding_problems SET
  description = $desc$Given an integer array nums of unique elements, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.$desc$,
  sample_input = $in$nums = [1,2,3]$in$,
  sample_output = $out$[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]$out$,
  constraints = $const$1 <= nums.length <= 10
-10 <= nums[i] <= 10
All the numbers of nums are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 78;

-- Update 79. Word Search
UPDATE coding_problems SET
  description = $desc$Given an m x n grid of characters board and a string word, return true if word exists in the grid.

The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.$desc$,
  sample_input = $in$board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"$in$,
  sample_output = $out$true$out$,
  constraints = $const$m == board.length
n = board[i].length
1 <= m, n <= 6
1 <= word.length <= 15
board and word consist of only lowercase and uppercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};","java":"class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}","python":"class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        ","javascript":"/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 79;

-- Update 98. Validate BST
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, determine if it is a valid binary search tree (BST).$desc$,
  sample_input = $in$root = [2,1,3]$in$,
  sample_output = $out$true$out$,
  constraints = $const$The number of nodes in the tree is in the range [1, 10^4].
-2^31 <= Node.val <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public boolean isValidBST(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isValidBST = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 98;

-- Update 102. Binary Tree Level Order Traversal
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).$desc$,
  sample_input = $in$root = [3,9,20,null,null,15,7]$in$,
  sample_output = $out$[[3],[9,20],[15,7]]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 2000].
-1000 <= Node.val <= 1000$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {number[][]}\n */\nvar levelOrder = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 102;

-- Update 103. Binary Tree Zigzag Level Order Traversal
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, return the zigzag level order traversal of its nodes' values. (i.e., from left to right, then right to left for the next level and alternate between).$desc$,
  sample_input = $in$root = [3,9,20,null,null,15,7]$in$,
  sample_output = $out$[[3],[20,9],[15,7]]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 2000].
-100 <= Node.val <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def zigzagLevelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {number[][]}\n */\nvar zigzagLevelOrder = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 103;

-- Update 105. Construct Binary Tree from Preorder and Inorder Traversal
UPDATE coding_problems SET
  description = $desc$Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.$desc$,
  sample_input = $in$preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]$in$,
  sample_output = $out$[3,9,20,null,null,15,7]$out$,
  constraints = $const$1 <= preorder.length <= 3000
inorder.length == preorder.length
-3000 <= preorder[i], inorder[i] <= 3000
preorder and inorder consist of unique values.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {\n        \n    }\n};","java":"class Solution {\n    public TreeNode buildTree(int[] preorder, int[] inorder) {\n        \n    }\n}","python":"class Solution:\n    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:\n        ","javascript":"/**\n * @param {number[]} preorder\n * @param {number[]} inorder\n * @return {TreeNode}\n */\nvar buildTree = function(preorder, inorder) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 105;

-- Update 114. Flatten Binary Tree to Linked List
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, flatten the tree into a "linked list":
- The "linked list" should use the same TreeNode class where the right child pointer points to the next node in the list and the left child pointer is always null.
- The "linked list" should be in the same order as a pre-order traversal of the binary tree.$desc$,
  sample_input = $in$root = [1,2,5,3,4,null,6]$in$,
  sample_output = $out$[1,null,2,null,3,null,4,null,5,null,6]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 2000].
-100 <= Node.val <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void flatten(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public void flatten(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def flatten(self, root: Optional[TreeNode]) -> None:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {void} Do not return anything, modify root in-place instead.\n */\nvar flatten = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 114;

-- Update 128. Longest Consecutive Sequence
UPDATE coding_problems SET
  description = $desc$Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in O(n) time.$desc$,
  sample_input = $in$nums = [100,4,200,1,3,2]$in$,
  sample_output = $out$4$out$,
  constraints = $const$0 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int longestConsecutive(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 128;

-- Update 130. Surrounded Regions
UPDATE coding_problems SET
  description = $desc$Given an m x n matrix board containing 'X' and 'O', capture all regions that are 4-directionally surrounded by 'X'.

A region is captured by flipping all 'O's into 'X's in that surrounded region.$desc$,
  sample_input = $in$board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]$in$,
  sample_output = $out$[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]$out$,
  constraints = $const$m == board.length
n == board[i].length
1 <= m, n <= 200
board[i][j] is 'X' or 'O'.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void solve(vector<vector<char>>& board) {\n        \n    }\n};","java":"class Solution {\n    public void solve(char[][] board) {\n        \n    }\n}","python":"class Solution:\n    def solve(self, board: List[List[str]]) -> None:\n        ","javascript":"/**\n * @param {character[][]} board\n * @return {void} Do not return anything, modify board in-place instead.\n */\nvar solve = function(board) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 130;

-- Update 138. Copy List with Random Pointer
UPDATE coding_problems SET
  description = $desc$A linked list of length n is given such that each node contains an additional random pointer, which could point to any node in the list, or null.

Construct a deep copy of the list.$desc$,
  sample_input = $in$head = [[7,null],[13,0],[11,4],[10,2],[1,0]]$in$,
  sample_output = $out$[[7,null],[13,0],[11,4],[10,2],[1,0]]$out$,
  constraints = $const$0 <= n <= 1000
-10^4 <= Node.val <= 10^4
Node.random is null or pointing to some node in the linked list.$const$,
  starter_code = $code${"cpp":"/*\n// Definition for a Node.\nclass Node {\npublic:\n    int val;\n    Node* next;\n    Node* random;\n    Node(int _val) {\n        val = _val;\n        next = NULL;\n        random = NULL;\n    }\n};\n*/\nclass Solution {\npublic:\n    Node* copyRandomList(Node* head) {\n        \n    }\n};","java":"/*\n// Definition for a Node.\nclass Node {\n    int val;\n    Node next;\n    Node random;\n    public Node(int val) {\n        this.val = val;\n        this.next = null;\n        this.random = null;\n    }\n}\n*/\nclass Solution {\n    public Node copyRandomList(Node head) {\n        \n    }\n}","python":"class Solution:\n    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':\n        ","javascript":"/**\n * // Definition for a Node.\n * function Node(val, next, random) {\n *    this.val = val;\n *    this.next = next;\n *    this.random = random;\n * };\n */\n/**\n * @param {Node} head\n * @return {Node}\n */\nvar copyRandomList = function(head) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 138;

-- Update 142. Linked List Cycle II
UPDATE coding_problems SET
  description = $desc$Given the head of a linked list, return the node where the cycle begins. If there is no cycle, return null.$desc$,
  sample_input = $in$head = [3,2,0,-4], pos = 1$in$,
  sample_output = $out$tail connects to node index 1$out$,
  constraints = $const$The number of nodes in the list is in the range [0, 10^4].
-10^5 <= Node.val <= 10^5
pos is -1 or a valid index in the linked-list.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    ListNode *detectCycle(ListNode *head) {\n        \n    }\n};","java":"public class Solution {\n    public ListNode detectCycle(ListNode head) {\n        \n    }\n}","python":"class Solution:\n    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ","javascript":"/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar detectCycle = function(head) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 142;

-- Update 143. Reorder List
UPDATE coding_problems SET
  description = $desc$You are given the head of a singly linked list. Reorder the list to be: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → ...

You may not modify the values in the list's nodes. Only nodes themselves may be changed.$desc$,
  sample_input = $in$head = [1,2,3,4]$in$,
  sample_output = $out$[1,4,2,3]$out$,
  constraints = $const$The number of nodes in the list is in the range [1, 5 * 10^4].
1 <= Node.val <= 1000$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    void reorderList(ListNode* head) {\n        \n    }\n};","java":"class Solution {\n    public void reorderList(ListNode head) {\n        \n    }\n}","python":"class Solution:\n    def reorderList(self, head: Optional[ListNode]) -> None:\n        ","javascript":"/**\n * @param {ListNode} head\n * @return {void} Do not return anything, modify head in-place instead.\n */\nvar reorderList = function(head) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 143;

-- Update 146. LRU Cache
UPDATE coding_problems SET
  description = $desc$Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class with get and put methods.$desc$,
  sample_input = $in$["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]$in$,
  sample_output = $out$[null, null, null, 1, null, -1, null, -1, 3, 4]$out$,
  constraints = $const$1 <= capacity <= 3000
0 <= key <= 10^4
0 <= value <= 10^5
At most 2 * 10^5 calls will be made to get and put.$const$,
  starter_code = $code${"cpp":"class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    \n    int get(int key) {\n        \n    }\n    \n    void put(int key, int value) {\n        \n    }\n};","java":"class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        \n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}","python":"class LRUCache:\n    def __init__(self, capacity: int):\n        \n    def get(self, key: int) -> int:\n        \n    def put(self, key: int, value: int) -> None:\n        ","javascript":"/**\n * @param {number} capacity\n */\nvar LRUCache = function(capacity) {\n    \n};\n\n/** \n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n    \n};\n\n/** \n * @param {number} key \n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 146;

-- Update 150. Evaluate Reverse Polish Notation
UPDATE coding_problems SET
  description = $desc$You are given an array of strings tokens that represents an arithmetic expression in a Reverse Polish Notation.

Evaluate the expression. Return an integer that represents the value of the expression.$desc$,
  sample_input = $in$tokens = ["2","1","+","3","*"]$in$,
  sample_output = $out$9$out$,
  constraints = $const$1 <= tokens.length <= 10^4
tokens[i] is either an operator or an integer.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int evalRPN(vector<string>& tokens) {\n        \n    }\n};","java":"class Solution {\n    public int evalRPN(String[] tokens) {\n        \n    }\n}","python":"class Solution:\n    def evalRPN(self, tokens: List[str]) -> int:\n        ","javascript":"/**\n * @param {string[]} tokens\n * @return {number}\n */\nvar evalRPN = function(tokens) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 150;

-- Update 199. Binary Tree Right Side View
UPDATE coding_problems SET
  description = $desc$Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.$desc$,
  sample_input = $in$root = [1,2,3,null,5,null,4]$in$,
  sample_output = $out$[1,3,4]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 100].
-100 <= Node.val <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> rightSideView(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public List<Integer> rightSideView(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {number[]}\n */\nvar rightSideView = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 199;

-- Update 200. Number of Islands
UPDATE coding_problems SET
  description = $desc$Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.$desc$,
  sample_input = $in$grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]$in$,
  sample_output = $out$1$out$,
  constraints = $const$m == grid.length
n == grid[i].length
1 <= m, n <= 300
grid[i][j] is '0' or '1'.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};","java":"class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}","python":"class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ","javascript":"/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 200;

-- Update 215. Kth Largest Element in an Array
UPDATE coding_problems SET
  description = $desc$Given an integer array nums and an integer k, return the kth largest element in the array.

Note that it is the kth largest element in the sorted order, not the kth distinct element.

Can you solve it without sorting in O(n) time?$desc$,
  sample_input = $in$nums = [3,2,1,5,6,4], k = 2$in$,
  sample_output = $out$5$out$,
  constraints = $const$1 <= k <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};","java":"class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}","python":"class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 215;

-- Update 230. Kth Smallest Element in a BST
UPDATE coding_problems SET
  description = $desc$Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.$desc$,
  sample_input = $in$root = [3,1,4,null,2], k = 1$in$,
  sample_output = $out$1$out$,
  constraints = $const$The number of nodes in the tree is n.
1 <= k <= n <= 10^4
0 <= Node.val <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int kthSmallest(TreeNode* root, int k) {\n        \n    }\n};","java":"class Solution {\n    public int kthSmallest(TreeNode root, int k) {\n        \n    }\n}","python":"class Solution:\n    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @param {number} k\n * @return {number}\n */\nvar kthSmallest = function(root, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 230;

-- Update 236. Lowest Common Ancestor of a Binary Tree
UPDATE coding_problems SET
  description = $desc$Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.

According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself)."$desc$,
  sample_input = $in$root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1$in$,
  sample_output = $out$3$out$,
  constraints = $const$The number of nodes in the tree is in the range [2, 10^5].
All Node.val are unique.
p and q will exist in the tree.
p != q$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};","java":"class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        \n    }\n}","python":"class Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        ","javascript":"/**\n * @param {TreeNode} root\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {TreeNode}\n */\nvar lowestCommonAncestor = function(root, p, q) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 236;

-- Update 238. Product of Array Except Self
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in O(n) time and without using the division operation.$desc$,
  sample_input = $in$nums = [1,2,3,4]$in$,
  sample_output = $out$[24,12,8,6]$out$,
  constraints = $const$2 <= nums.length <= 10^5
-30 <= nums[i] <= 30
The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 238;

-- Update 287. Find the Duplicate Number
UPDATE coding_problems SET
  description = $desc$Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive.

There is only one repeated number in nums, return this repeated number.

You must solve the problem without modifying the array nums and uses only constant extra space.$desc$,
  sample_input = $in$nums = [1,3,4,2,2]$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= n <= 10^5
nums.length == n + 1
1 <= nums[i] <= n
All the integers in nums appear only once except for precisely one integer which appears two or more times.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int findDuplicate(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int findDuplicate(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 287;

-- Update 347. Top K Frequent Elements
UPDATE coding_problems SET
  description = $desc$Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.$desc$,
  sample_input = $in$nums = [1,1,1,2,2,3], k = 2$in$,
  sample_output = $out$[1,2]$out$,
  constraints = $const$1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4
k is in the range [1, the number of unique elements in the array].
It is guaranteed that the answer is unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        \n    }\n};","java":"class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}","python":"class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 347;

-- Update 394. Decode String
UPDATE coding_problems SET
  description = $desc$Given an encoded string, return its decoded string.

The encoding rule is: k[encoded_string], where the encoded_string inside the square brackets is being repeated exactly k times. Note that k is guaranteed to be a positive integer.

You may assume that the input string is always valid; there are no extra spaces, square brackets are well-formed, etc.$desc$,
  sample_input = $in$s = "3[a]2[bc]"$in$,
  sample_output = $out$s = "3[a]2[bc]"$out$,
  constraints = $const$1 <= s.length <= 30
s consists of lowercase English letters, digits, and square brackets '[]'.
s is guaranteed to be a valid input.
All the integers in s are in the range [1, 300].$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    string decodeString(string s) {\n        \n    }\n};","java":"class Solution {\n    public String decodeString(String s) {\n        \n    }\n}","python":"class Solution:\n    def decodeString(self, s: str) -> str:\n        ","javascript":"/**\n * @param {string} s\n * @return {string}\n */\nvar decodeString = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 394;

-- Update 417. Pacific Atlantic Water Flow
UPDATE coding_problems SET
  description = $desc$There is an m x n rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the island's right and bottom edges.

The island is partitioned into a grid of square cells. You are given an m x n integer matrix heights where heights[r][c] represents the height above sea level of the cell at coordinate (r, c).

Return a 2D list of grid coordinates result where result[i] = [ri, ci] denotes that rain water can flow from cell (ri, ci) to both the Pacific and Atlantic oceans.$desc$,
  sample_input = $in$heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]$in$,
  sample_output = $out$[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]$out$,
  constraints = $const$m == heights.length
n == heights[r].length
1 <= m, n <= 200
0 <= heights[r][c] <= 10^5$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n        \n    }\n};","java":"class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        \n    }\n}","python":"class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[][]} heights\n * @return {number[][]}\n */\nvar pacificAtlantic = function(heights) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 417;

-- Update 424. Longest Repeating Character Replacement
UPDATE coding_problems SET
  description = $desc$You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.$desc$,
  sample_input = $in$s = "ABAB", k = 2$in$,
  sample_output = $out$4$out$,
  constraints = $const$1 <= s.length <= 10^5
s consists of uppercase English letters.
0 <= k <= s.length$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        \n    }\n};","java":"class Solution {\n    public int characterReplacement(String s, int k) {\n        \n    }\n}","python":"class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        ","javascript":"/**\n * @param {string} s\n * @param {number} k\n * @return {number}\n */\nvar characterReplacement = function(s, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 424;

-- Update 435. Non Overlapping Intervals
UPDATE coding_problems SET
  description = $desc$Given an array of intervals intervals where intervals[i] = [start_i, end_i], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.$desc$,
  sample_input = $in$intervals = [[1,2],[2,3],[3,4],[1,3]]$in$,
  sample_output = $out$1$out$,
  constraints = $const$1 <= intervals.length <= 10^5
intervals[i].length == 2
-5 * 10^4 <= start_i < end_i <= 5 * 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        \n    }\n};","java":"class Solution {\n    public int eraseOverlapIntervals(int[][] intervals) {\n        \n    }\n}","python":"class Solution:\n    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:\n        ","javascript":"/**\n * @param {number[][]} intervals\n * @return {number}\n */\nvar eraseOverlapIntervals = function(intervals) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 435;

-- Update 542. 01 Matrix
UPDATE coding_problems SET
  description = $desc$Given an m x n binary matrix mat, return the distance of the nearest 0 for each cell.

The distance between two adjacent cells is 1.$desc$,
  sample_input = $in$mat = [[0,0,0],[0,1,0],[0,0,0]]$in$,
  sample_output = $out$[[0,0,0],[0,1,0],[0,0,0]]$out$,
  constraints = $const$m == mat.length
n == mat[i].length
1 <= m, n <= 10^4
1 <= m * n <= 10^4
mat[i][j] is either 0 or 1.
There is at least one 0 in mat.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {\n        \n    }\n};","java":"class Solution {\n    public int[][] updateMatrix(int[][] mat) {\n        \n    }\n}","python":"class Solution:\n    def updateMatrix(self, mat: List[List[int]]) -> List[List[int]]:\n        ","javascript":"/**\n * @param {number[][]} mat\n * @return {number[][]}\n */\nvar updateMatrix = function(mat) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 542;

-- Update 721. Accounts Merge
UPDATE coding_problems SET
  description = $desc$Given a list of accounts where each element accounts[i] is a list of strings, where the first element accounts[i][0] is a name, and the rest of the elements are emails representing this account.

Two accounts definitely belong to the same person if there is some common email to both accounts. Note that even if two accounts have the same name, they may belong to different people as people could have the same name. A person can have any number of accounts initially, but all of their accounts definitely have the same name.

After merging the accounts, return the accounts in the following format: the first element of each account is the name, and the rest of the elements are emails in sorted order. The accounts themselves can be returned in any order.$desc$,
  sample_input = $in$accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]$in$,
  sample_output = $out$[["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]$out$,
  constraints = $const$1 <= accounts.length <= 1000
2 <= accounts[i].length <= 10
1 <= accounts[i][j].length <= 30
accounts[i][0] consists of English letters.
accounts[i][j] (for j > 0) is a valid email.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {\n        \n    }\n};","java":"class Solution {\n    public List<List<String>> accountsMerge(List<List<String>> accounts) {\n        \n    }\n}","python":"class Solution:\n    def accountsMerge(self, accounts: List[List[str]]) -> List[List[str]]:\n        ","javascript":"/**\n * @param {string[][]} accounts\n * @return {string[][]}\n */\nvar accountsMerge = function(accounts) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 721;

-- Update 4. Median of Two Sorted Arrays
UPDATE coding_problems SET
  description = $desc$Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).$desc$,
  sample_input = $in$nums1 = [1,3], nums2 = [2]$in$,
  sample_output = $out$2.0$out$,
  constraints = $const$nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-10^6 <= nums1[i], nums2[j] <= 10^6$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};","java":"class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        \n    }\n}","python":"class Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        ","javascript":"/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar findMedianSortedArrays = function(nums1, nums2) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 4;

-- Update 10. Regular Expression Matching
UPDATE coding_problems SET
  description = $desc$Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where:
- '.' Matches any single character.
- '*' Matches zero or more of the preceding element.

The matching should cover the entire input string (not partial).$desc$,
  sample_input = $in$s = "aa", p = "a*"$in$,
  sample_output = $out$true$out$,
  constraints = $const$1 <= s.length <= 20
1 <= p.length <= 20
s contains only lowercase English letters.
p contains only lowercase English letters, '.', and '*'.
It is guaranteed for each appearance of the character '*', there will be a previous valid character to match.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    bool isMatch(string s, string p) {\n        \n    }\n};","java":"class Solution {\n    public boolean isMatch(String s, String p) {\n        \n    }\n}","python":"class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        ","javascript":"/**\n * @param {string} s\n * @param {string} p\n * @return {boolean}\n */\nvar isMatch = function(s, p) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 10;

-- Update 23. Merge K Sorted Lists
UPDATE coding_problems SET
  description = $desc$You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.$desc$,
  sample_input = $in$lists = [[1,4,5],[1,3,4],[2,6]]$in$,
  sample_output = $out$[1,1,2,3,4,4,5,6]$out$,
  constraints = $const$k == lists.length
0 <= k <= 10^4
0 <= lists[i].length <= 500
-10^4 <= lists[i][j] <= 10^4
lists[i] is sorted in ascending order.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};","java":"class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}","python":"class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        ","javascript":"/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nvar mergeKLists = function(lists) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 23;

-- Update 25. Reverse Nodes in K Group
UPDATE coding_problems SET
  description = $desc$Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list.

k is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list's nodes, only nodes themselves may be changed.$desc$,
  sample_input = $in$head = [1,2,3,4,5], k = 2$in$,
  sample_output = $out$[2,1,4,3,5]$out$,
  constraints = $const$The number of nodes in the list is n.
1 <= k <= n <= 5000
0 <= Node.val <= 1000$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    ListNode* reverseKGroup(ListNode* head, int k) {\n        \n    }\n};","java":"class Solution {\n    public ListNode reverseKGroup(ListNode head, int k) {\n        \n    }\n}","python":"class Solution:\n    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n        ","javascript":"/**\n * @param {ListNode} head\n * @param {number} k\n * @return {ListNode}\n */\nvar reverseKGroup = function(head, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 25;

-- Update 32. Longest Valid Parentheses
UPDATE coding_problems SET
  description = $desc$Given a string s containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.$desc$,
  sample_input = $in$s = "(()"$in$,
  sample_output = $out$2$out$,
  constraints = $const$0 <= s.length <= 3 * 10^4
s[i] is '(' or ')'.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int longestValidParentheses(string s) {\n        \n    }\n};","java":"class Solution {\n    public int longestValidParentheses(String s) {\n        \n    }\n}","python":"class Solution:\n    def longestValidParentheses(self, s: str) -> int:\n        ","javascript":"/**\n * @param {string} s\n * @return {number}\n */\nvar longestValidParentheses = function(s) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 32;

-- Update 42. Trapping Rain Water
UPDATE coding_problems SET
  description = $desc$Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.$desc$,
  sample_input = $in$height = [0,1,0,2,1,0,1,3,2,1,2,1]$in$,
  sample_output = $out$6$out$,
  constraints = $const$n == height.length
1 <= n <= 2 * 10^4
0 <= height[i] <= 10^5$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};","java":"class Solution {\n    public int trap(int[] height) {\n        \n    }\n}","python":"class Solution:\n    def trap(self, height: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 42;

-- Update 51. N Queens
UPDATE coding_problems SET
  description = $desc$The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.

Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order.

Each solution contains a distinct board configuration of the n-queens' placement, where 'Q' and '.' both indicate a queen and an empty space, respectively.$desc$,
  sample_input = $in$n = 4$in$,
  sample_output = $out$[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]$out$,
  constraints = $const$1 <= n <= 9$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<vector<string>> solveNQueens(int n) {\n        \n    }\n};","java":"class Solution {\n    public List<List<String>> solveNQueens(int n) {\n        \n    }\n}","python":"class Solution:\n    def solveNQueens(self, n: int) -> List[List[str]]:\n        ","javascript":"/**\n * @param {number} n\n * @return {string[][]}\n */\nvar solveNQueens = function(n) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 51;

-- Update 72. Edit Distance
UPDATE coding_problems SET
  description = $desc$Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.

You have the following three operations permitted on a word:
1. Insert a character
2. Delete a character
3. Replace a character$desc$,
  sample_input = $in$word1 = "horse", word2 = "ros"$in$,
  sample_output = $out$3$out$,
  constraints = $const$0 <= word1.length, word2.length <= 500
word1 and word2 consist of lowercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        \n    }\n};","java":"class Solution {\n    public int minDistance(String word1, String word2) {\n        \n    }\n}","python":"class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        ","javascript":"/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nvar minDistance = function(word1, word2) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 72;

-- Update 76. Minimum Window Substring
UPDATE coding_problems SET
  description = $desc$Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string "".$desc$,
  sample_input = $in$s = "ADOBECODEBANC", t = "ABC"$in$,
  sample_output = $out$"BANC"$out$,
  constraints = $const$m == s.length
n == t.length
1 <= m, n <= 10^5
s and t consist of uppercase and lowercase English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};","java":"class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}","python":"class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ","javascript":"/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 76;

-- Update 84. Largest Rectangle in Histogram
UPDATE coding_problems SET
  description = $desc$Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.$desc$,
  sample_input = $in$heights = [2,1,5,6,2,3]$in$,
  sample_output = $out$10$out$,
  constraints = $const$1 <= heights.length <= 10^5
0 <= heights[i] <= 10^4$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        \n    }\n};","java":"class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}","python":"class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} heights\n * @return {number}\n */\nvar largestRectangleArea = function(heights) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 84;

-- Update 85. Maximal Rectangle
UPDATE coding_problems SET
  description = $desc$Given a rows x cols binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.$desc$,
  sample_input = $in$matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]$in$,
  sample_output = $out$6$out$,
  constraints = $const$rows == matrix.length
cols == matrix[i].length
1 <= matrix.length, matrix[i].length <= 200
matrix[i][j] is '0' or '1'.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maximalRectangle(vector<vector<char>>& matrix) {\n        \n    }\n};","java":"class Solution {\n    public int maximalRectangle(char[][] matrix) {\n        \n    }\n}","python":"class Solution:\n    def maximalRectangle(self, matrix: List[List[str]]) -> int:\n        ","javascript":"/**\n * @param {character[][]} matrix\n * @return {number}\n */\nvar maximalRectangle = function(matrix) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 85;

-- Update 115. Distinct Subsequences
UPDATE coding_problems SET
  description = $desc$Given two strings s and t, return the number of distinct subsequences of s which equals t.

The test cases are generated so that the answer fits in a 32-bit signed integer.$desc$,
  sample_input = $in$s = "rabbbit", t = "rabbit"$in$,
  sample_output = $out$3$out$,
  constraints = $const$1 <= s.length, t.length <= 1000
s and t consist of English letters.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int numDistinct(string s, string t) {\n        \n    }\n};","java":"class Solution {\n    public int numDistinct(String s, String t) {\n        \n    }\n}","python":"class Solution:\n    def numDistinct(self, s: str, t: str) -> int:\n        ","javascript":"/**\n * @param {string} s\n * @param {string} t\n * @return {number}\n */\nvar numDistinct = function(s, t) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 115;

-- Update 124. Binary Tree Maximum Path Sum
UPDATE coding_problems SET
  description = $desc$A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.

The path sum of a path is the sum of the node's values in the path.

Given the root of a binary tree, return the maximum path sum of any non-empty path.$desc$,
  sample_input = $in$root = [1,2,3]$in$,
  sample_output = $out$6$out$,
  constraints = $const$The number of nodes in the tree is in the range [1, 3 * 10^4].
-1000 <= Node.val <= 1000$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maxPathSum(TreeNode* root) {\n        \n    }\n};","java":"class Solution {\n    public int maxPathSum(TreeNode root) {\n        \n    }\n}","python":"class Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        ","javascript":"/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxPathSum = function(root) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 124;

-- Update 127. Word Ladder
UPDATE coding_problems SET
  description = $desc$A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that:
1. Every adjacent pair of words differs by a single letter.
2. Every si is in wordList. Note that beginWord does not need to be in wordList.
3. sk == endWord.

Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists.$desc$,
  sample_input = $in$beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]$in$,
  sample_output = $out$5$out$,
  constraints = $const$1 <= beginWord.length <= 10
endWord.length == beginWord.length
1 <= wordList.length <= 5000
wordList[i].length == beginWord.length
beginWord, endWord, and wordList[i] consist of lowercase English letters.
beginWord != endWord
All words in wordList are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        \n    }\n};","java":"class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        \n    }\n}","python":"class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        ","javascript":"/**\n * @param {string} beginWord\n * @param {string} endWord\n * @param {string[]} wordList\n * @return {number}\n */\nvar ladderLength = function(beginWord, endWord, wordList) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 127;

-- Update 140. Word Break II
UPDATE coding_problems SET
  description = $desc$Given a string s and a dictionary of strings wordDict, add spaces in s to construct a sentence where each word is a valid dictionary word. Return all such possible sentences in any order.

Note that the same word in the dictionary may be reused multiple times in the segmentation.$desc$,
  sample_input = $in$s = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]$in$,
  sample_output = $out$["cats and dog","cat sand dog"]$out$,
  constraints = $const$1 <= s.length <= 20
1 <= wordDict.length <= 1000
1 <= wordDict[i].length <= 10
s and wordDict[i] consist of lowercase English letters.
All the strings of wordDict are unique.
Input is generated such that the length of the answer is at most 10^5.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<string> wordBreak(string s, vector<string>& wordDict) {\n        \n    }\n};","java":"class Solution {\n    public List<String> wordBreak(String s, List<String> wordDict) {\n        \n    }\n}","python":"class Solution:\n    def wordBreak(self, s: str, wordDict: List[str]) -> List[str]:\n        ","javascript":"/**\n * @param {string} s\n * @param {string[]} wordDict\n * @return {string[]}\n */\nvar wordBreak = function(s, wordDict) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 140;

-- Update 212. Word Search II
UPDATE coding_problems SET
  description = $desc$Given an m x n board of characters and a list of strings words, return all words on the board.

Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.$desc$,
  sample_input = $in$board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]$in$,
  sample_output = $out$["eat","oath"]$out$,
  constraints = $const$m == board.length
n == board[i].length
1 <= m, n <= 12
1 <= words.length <= 3 * 10^4
1 <= words[i].length <= 10
words[i] consists of lowercase English letters.
All the strings of words are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {\n        \n    }\n};","java":"class Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        \n    }\n}","python":"class Solution:\n    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:\n        ","javascript":"/**\n * @param {character[][]} board\n * @param {string[]} words\n * @return {string[]}\n */\nvar findWords = function(board, words) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 212;

-- Update 239. Sliding Window Maximum
UPDATE coding_problems SET
  description = $desc$You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.

Return the max sliding window.$desc$,
  sample_input = $in$nums = [1,3,-1,-3,5,3,6,7], k = 3$in$,
  sample_output = $out$[3,3,5,5,6,7]$out$,
  constraints = $const$1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4
1 <= k <= nums.length$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};","java":"class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}","python":"class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 239;

-- Update 295. Find Median from Data Stream
UPDATE coding_problems SET
  description = $desc$The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.

Implement the MedianFinder class.$desc$,
  sample_input = $in$["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]
[[], [1], [2], [], [3], []]$in$,
  sample_output = $out$[null, null, null, 1.5, null, 2.0]$out$,
  constraints = $const$-10^5 <= num <= 10^5
There will be at least one element in the data structure before calling findMedian.
At most 5 * 10^4 calls will be made to addNum and findMedian.$const$,
  starter_code = $code${"cpp":"class MedianFinder {\npublic:\n    MedianFinder() {\n        \n    }\n    \n    void addNum(int num) {\n        \n    }\n    \n    double findMedian() {\n        \n    }\n};","java":"class MedianFinder {\n    public MedianFinder() {\n        \n    }\n    \n    public void addNum(int num) {\n        \n    }\n    \n    public double findMedian() {\n        \n    }\n}","python":"class MedianFinder:\n    def __init__(self):\n        \n    def addNum(self, num: int) -> None:\n        \n    def findMedian(self) -> float:\n        ","javascript":"var MedianFinder = function() {\n    \n};\n\n/** \n * @param {number} num\n * @return {void}\n */\nMedianFinder.prototype.addNum = function(num) {\n    \n};\n\n/**\n * @return {number}\n */\nMedianFinder.prototype.findMedian = function() {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 295;

-- Update 297. Serialize and Deserialize Binary Tree
UPDATE coding_problems SET
  description = $desc$Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary tree.$desc$,
  sample_input = $in$root = [1,2,3,null,null,4,5]$in$,
  sample_output = $out$[1,2,3,null,null,4,5]$out$,
  constraints = $const$The number of nodes in the tree is in the range [0, 10^4].
-1000 <= Node.val <= 1000$const$,
  starter_code = $code${"cpp":"class Codec {\npublic:\n    string serialize(TreeNode* root) {\n        \n    }\n    \n    TreeNode* deserialize(string data) {\n        \n    }\n};","java":"public class Codec {\n    public String serialize(TreeNode root) {\n        \n    }\n    \n    public TreeNode deserialize(String data) {\n        \n    }\n}","python":"class Codec:\n    def serialize(self, root):\n        \n    def deserialize(self, data):\n        ","javascript":"/**\n * Encodes a tree to a single string.\n *\n * @param {TreeNode} root\n * @return {string}\n */\nvar serialize = function(root) {\n    \n};\n\n/**\n * Decodes your encoded data to tree.\n *\n * @param {string} data\n * @return {TreeNode}\n */\nvar deserialize = function(data) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 297;

-- Update 312. Burst Balloons
UPDATE coding_problems SET
  description = $desc$You are given n balloons, indexed from 0 to n - 1. Each balloon is painted with a number on it represented by an array nums. You are asked to burst all the balloons.

If you burst the ith balloon, you will get nums[i - 1] * nums[i] * nums[i + 1] coins. If i - 1 or i + 1 goes out of bounds of the array, then treat it as if there is a balloon painted with a 1 on it.

Return the maximum coins you can collect by bursting the balloons wisely.$desc$,
  sample_input = $in$nums = [3,1,5,8]$in$,
  sample_output = $out$167$out$,
  constraints = $const$n == nums.length
1 <= n <= 300
0 <= nums[i] <= 100$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int maxCoins(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int maxCoins(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def maxCoins(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxCoins = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 312;

-- Update 329. Longest Increasing Path in a Matrix
UPDATE coding_problems SET
  description = $desc$Given an m x n integers matrix, return the length of the longest increasing path in matrix.

From each cell, you can either move in four directions: left, right, up, or down. You may not move diagonally or move outside the boundary.$desc$,
  sample_input = $in$matrix = [[9,9,4],[6,6,8],[2,1,1]]$in$,
  sample_output = $out$4$out$,
  constraints = $const$m == matrix.length
n == matrix[i].length
1 <= m, n <= 200
0 <= matrix[i][j] <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int longestIncreasingPath(vector<vector<int>>& matrix) {\n        \n    }\n};","java":"class Solution {\n    public int longestIncreasingPath(int[][] matrix) {\n        \n    }\n}","python":"class Solution:\n    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:\n        ","javascript":"/**\n * @param {number[][]} matrix\n * @return {number}\n */\nvar longestIncreasingPath = function(matrix) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 329;

-- Update 410. Split Array Largest Sum
UPDATE coding_problems SET
  description = $desc$Given an integer array nums and an integer k, split nums into k non-empty subarrays such that the largest sum of any subarray is minimized.

Return the minimized largest sum of the split.

A subarray is a contiguous part of the array.$desc$,
  sample_input = $in$nums = [7,2,5,10,8], k = 2$in$,
  sample_output = $out$18$out$,
  constraints = $const$1 <= nums.length <= 1000
0 <= nums[i] <= 10^6
1 <= k <= min(50, nums.length)$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int splitArray(vector<int>& nums, int k) {\n        \n    }\n};","java":"class Solution {\n    public int splitArray(int[] nums, int k) {\n        \n    }\n}","python":"class Solution:\n    def splitArray(self, nums: List[int], k: int) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar splitArray = function(nums, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 410;

-- Update 460. LFU Cache
UPDATE coding_problems SET
  description = $desc$Design and implement a data structure for a Least Frequently Used (LFU) cache.

Implement the LFUCache class with get and put methods.$desc$,
  sample_input = $in$["LFUCache", "put", "put", "get", "put", "get", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]]$in$,
  sample_output = $out$[null, null, null, 1, null, -1, 3, null, -1, 3, 4]$out$,
  constraints = $const$1 <= capacity <= 10^4
0 <= key <= 10^5
0 <= value <= 10^9
At most 2 * 10^5 calls will be made to get and put.$const$,
  starter_code = $code${"cpp":"class LFUCache {\npublic:\n    LFUCache(int capacity) {\n        \n    }\n    \n    int get(int key) {\n        \n    }\n    \n    void put(int key, int value) {\n        \n    }\n};","java":"class LFUCache {\n    public LFUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        \n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}","python":"class LFUCache:\n    def __init__(self, capacity: int):\n        \n    def get(self, key: int) -> int:\n        \n    def put(self, key: int, value: int) -> None:\n        ","javascript":"/**\n * @param {number} capacity\n */\nvar LFUCache = function(capacity) {\n    \n};\n\n/** \n * @param {number} key\n * @return {number}\n */\nLFUCache.prototype.get = function(key) {\n    \n};\n\n/** \n * @param {number} key \n * @param {number} value\n * @return {void}\n */\nLFUCache.prototype.put = function(key, value) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 460;

-- Update 480. Sliding Window Median
UPDATE coding_problems SET
  description = $desc$Median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value. So the median is the mean of the two middle values.

You are given an integer array nums and an integer k. There is a sliding window of size k which is moving from the very left of the array to the very right. Return the median array for each window.$desc$,
  sample_input = $in$nums = [1,3,-1,-3,5,3,6,7], k = 3$in$,
  sample_output = $out$[1.00000,-1.00000,-1.00000,3.00000,5.00000,6.00000]$out$,
  constraints = $const$1 <= k <= nums.length <= 10^5
-2^31 <= nums[i] <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<double> medianSlidingWindow(vector<int>& nums, int k) {\n        \n    }\n};","java":"class Solution {\n    public double[] medianSlidingWindow(int[] nums, int k) {\n        \n    }\n}","python":"class Solution:\n    def medianSlidingWindow(self, nums: List[int], k: int) -> List[float]:\n        ","javascript":"/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar medianSlidingWindow = function(nums, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 480;

-- Update 493. Reverse Pairs
UPDATE coding_problems SET
  description = $desc$Given an integer array nums, return the number of reverse pairs in the array.

A reverse pair is a pair (i, j) where 0 <= i < j < nums.length and nums[i] > 2 * nums[j].$desc$,
  sample_input = $in$nums = [1,3,2,3,1]$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= nums.length <= 5 * 10^4
-2^31 <= nums[i] <= 2^31 - 1$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int reversePairs(vector<int>& nums) {\n        \n    }\n};","java":"class Solution {\n    public int reversePairs(int[] nums) {\n        \n    }\n}","python":"class Solution:\n    def reversePairs(self, nums: List[int]) -> int:\n        ","javascript":"/**\n * @param {number[]} nums\n * @return {number}\n */\nvar reversePairs = function(nums) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 493;

-- Update 685. Redundant Connection II
UPDATE coding_problems SET
  description = $desc$In this problem, a rooted tree is a directed graph such that, there is exactly one node (the root) for which all other nodes can be reached by directed paths, and every node has exactly one parent, except for the root node which has no parents.

The given input is a directed graph that started as a rooted tree with n nodes (with distinct values from 1 to n), with one additional directed edge added. Find an edge that can be removed so that the resulting graph is a rooted tree.$desc$,
  sample_input = $in$edges = [[1,2],[1,3],[2,3]]$in$,
  sample_output = $out$[2,3]$out$,
  constraints = $const$n == edges.length
3 <= n <= 1000
edges[i].length == 2
1 <= u_i, v_i <= n$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {\n        \n    }\n};","java":"class Solution {\n    public int[] findRedundantDirectedConnection(int[][] edges) {\n        \n    }\n}","python":"class Solution:\n    def findRedundantDirectedConnection(self, edges: List[List[int]]) -> List[int]:\n        ","javascript":"/**\n * @param {number[][]} edges\n * @return {number[]}\n */\nvar findRedundantDirectedConnection = function(edges) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 685;

-- Update 743. Network Delay Time
UPDATE coding_problems SET
  description = $desc$You are given a network of n nodes, labeled from 1 to n. You are also given times, a list of travel times as directed edges times[i] = (u_i, v_i, w_i), where u_i is the source node, v_i is the target node, and w_i is the time it takes for a signal to travel from source to target.

We will send a signal from a given node k. Return the minimum time it takes for all the n nodes to receive the signal. If it is impossible for all the n nodes to receive the signal, return -1.$desc$,
  sample_input = $in$times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= k <= n <= 100
1 <= times.length <= 6000
times[i].length == 3
1 <= u_i, v_i <= n
0 <= w_i <= 100
All pairs (u_i, v_i) are unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int networkDelayTime(vector<vector<int>>& times, int n, int k) {\n        \n    }\n};","java":"class Solution {\n    public int networkDelayTime(int[][] times, int n, int k) {\n        \n    }\n}","python":"class Solution:\n    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:\n        ","javascript":"/**\n * @param {number[][]} times\n * @param {number} n\n * @param {number} k\n * @return {number}\n */\nvar networkDelayTime = function(times, n, k) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 743;

-- Update 778. Swim in Rising Water
UPDATE coding_problems SET
  description = $desc$You are given an n x n integer grid grid where each value grid[i][j] represents the elevation at that point (i, j). It starts raining. At time t, the depth of the water everywhere is t.

You can swim from a square to another 4-directionally adjacent square if and only if both elevations are at most t. You can swim infinite distances in zero time.

Return the least time until you can reach the bottom right square (n-1, n-1) starting from the top left square (0, 0).$desc$,
  sample_input = $in$grid = [[0,2],[1,3]]$in$,
  sample_output = $out$3$out$,
  constraints = $const$n == grid.length
n == grid[i].length
1 <= n <= 50
0 <= grid[i][j] < n^2
Each value is unique.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int swimInWater(vector<vector<int>>& grid) {\n        \n    }\n};","java":"class Solution {\n    public int swimInWater(int[][] grid) {\n        \n    }\n}","python":"class Solution:\n    def swimInWater(self, grid: List[List[int]]) -> int:\n        ","javascript":"/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar swimInWater = function(grid) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 778;

-- Update 815. Bus Routes
UPDATE coding_problems SET
  description = $desc$You are given an array routes representing bus routes where routes[i] is a bus route that the ith bus repeats forever.

For example, if routes[0] = [1, 5, 7], this means that the 0th bus travels in the sequence 1 -> 5 -> 7 -> 1 -> 5 -> 7 -> ... forever.

You will start at the source stop, and you want to go to the target stop. You can travel between bus stops by buses only.

Return the least number of buses you must take to travel from source to target. If it is impossible, return -1.$desc$,
  sample_input = $in$routes = [[1,2,7],[3,6,7]], source = 1, target = 6$in$,
  sample_output = $out$2$out$,
  constraints = $const$1 <= routes.length <= 500
1 <= routes[i].length <= 10^5
All values in routes[i] are unique.
0 <= routes[i][j] < 10^6
0 <= source, target < 10^6$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int numBusesToDestination(vector<vector<int>>& routes, int source, int target) {\n        \n    }\n};","java":"class Solution {\n    public int numBusesToDestination(int[][] routes, int source, int target) {\n        \n    }\n}","python":"class Solution:\n    def numBusesToDestination(self, routes: List[List[int]], source: int, target: int) -> int:\n        ","javascript":"/**\n * @param {number[][]} routes\n * @param {number} source\n * @param {number} target\n * @return {number}\n */\nvar numBusesToDestination = function(routes, source, target) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 815;

-- Update 847. Shortest Path Visiting All Nodes
UPDATE coding_problems SET
  description = $desc$You have an undirected, connected graph of n nodes labeled from 0 to n - 1. You are given an array graph where graph[i] is a list of all the nodes connected with node i by an edge.

Return the length of the shortest path that visits every node. You may start and stop at any node, you may revisit nodes multiple times, and you may reuse edges.$desc$,
  sample_input = $in$graph = [[1,2,3],[0],[0],[0]]$in$,
  sample_output = $out$4$out$,
  constraints = $const$n == graph.length
1 <= n <= 12
0 <= graph[i].length < n
graph[i] does not contain i.
If graph[a] contains b, then graph[b] contains a.
The input graph is guaranteed to be connected.$const$,
  starter_code = $code${"cpp":"class Solution {\npublic:\n    int shortestPathLength(vector<vector<int>>& graph) {\n        \n    }\n};","java":"class Solution {\n    public int shortestPathLength(int[][] graph) {\n        \n    }\n}","python":"class Solution:\n    def shortestPathLength(self, graph: List[List[int]]) -> int:\n        ","javascript":"/**\n * @param {number[][]} graph\n * @return {number}\n */\nvar shortestPathLength = function(graph) {\n    \n};"}$code$::jsonb
WHERE leetcode_number = 847;

COMMIT;
