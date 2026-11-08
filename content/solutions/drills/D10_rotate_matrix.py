N = int(input("Enter N: "))
print("Enter the matrix:")
m = [input().split() for _ in range(N)]

# 90 degrees clockwise = reverse the row order, then turn columns into rows
rotated = [list(row) for row in zip(*m[::-1])]

print("Rotated:")
for row in rotated:
    print(*row)
