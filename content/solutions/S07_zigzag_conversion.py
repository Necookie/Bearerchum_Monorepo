s = input("Enter string: ")
num_rows = int(input("Enter number of rows: "))

if num_rows == 1 or num_rows >= len(s):
    result = s                          # no zigzag possible
else:
    rows = [""] * num_rows
    r, step = 0, 1
    for ch in s:
        rows[r] += ch
        if r == 0:
            step = 1                    # bounce off the top -> go down
        elif r == num_rows - 1:
            step = -1                   # bounce off the bottom -> go up
        r += step
    result = "".join(rows)

print(f"Converted string: {result}")
