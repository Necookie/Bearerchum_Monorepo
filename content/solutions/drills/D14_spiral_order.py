R, C = map(int, input("Enter rows and columns: ").split())
print("Enter the matrix:")
m = [input().split() for _ in range(R)]

top, bottom, left, right = 0, R - 1, 0, C - 1
out = []
while top <= bottom and left <= right:
    for j in range(left, right + 1):            # go right along the top row
        out.append(m[top][j])
    top += 1
    for i in range(top, bottom + 1):            # go down the right column
        out.append(m[i][right])
    right -= 1
    if top <= bottom:
        for j in range(right, left - 1, -1):    # go left along the bottom row
            out.append(m[bottom][j])
        bottom -= 1
    if left <= right:
        for i in range(bottom, top - 1, -1):    # go up the left column
            out.append(m[i][left])
        left += 1

print("Spiral order:", *out)
