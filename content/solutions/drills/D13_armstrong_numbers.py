L, R = map(int, input("Enter L and R: ").split())

found = []
for x in range(L, R + 1):
    digits = str(x)
    power = len(digits)
    if sum(int(d) ** power for d in digits) == x:
        found.append(x)

if found:
    print("Armstrong numbers:", *found)
else:
    print("Armstrong numbers: None")
