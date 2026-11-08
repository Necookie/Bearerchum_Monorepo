U = int(input("Enter cubic meters used: "))

first = min(U, 10)            # up to 10 m3 at 15 pesos
extra = max(U - 10, 0)        # anything above 10 m3 at 25 pesos
bill = first * 15 + extra * 25

print(f"Bill: {bill}")
