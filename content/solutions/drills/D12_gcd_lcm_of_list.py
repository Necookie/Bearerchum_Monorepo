from math import gcd

N = int(input("Enter N: "))
nums = list(map(int, input("Enter numbers: ").split()))

g = nums[0]
l = nums[0]
for x in nums[1:]:
    g = gcd(g, x)
    l = l * x // gcd(l, x)        # lcm(a, b) = a*b / gcd(a, b)

print(f"GCD: {g}")
print(f"LCM: {l}")
