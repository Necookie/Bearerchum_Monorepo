S = int(input("Enter seats in first row: "))
R = int(input("Enter number of rows: "))

# Rows have S, S+2, S+4, ... seats -> loop and add
total = 0
seats = S
for _ in range(R):
    total += seats
    seats += 2

# One-line formula version: total = S*R + R*(R-1)
print(f"Total seats: {total}")
