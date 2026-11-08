N = int(input("Enter a positive integer N: "))

total = 0
fact = 1
for k in range(1, N + 1):
    fact *= k                       # build k! from (k-1)!  -- no recomputing
    if k % 2 == 1:
        total += fact
    else:
        total -= fact

print(f"The alternating factorial sum is: {total}")
