N = int(input("Enter the number of rows (N): "))
print(f"Pascal's Triangle with {N} rows:")

row = [1]
for _ in range(N):
    print(*row)
    # next row: 1, then sums of neighbours, then 1
    row = [1] + [row[i] + row[i + 1] for i in range(len(row) - 1)] + [1]
