s = input("Enter expression: ")
PAIR = {')': '(', ']': '[', '}': '{'}

stack = []
ok = True
for ch in s:
    if ch in "([{":
        stack.append(ch)
    elif ch in ")]}":
        if not stack or stack[-1] != PAIR[ch]:
            ok = False
            break
        stack.pop()

if stack:                 # something was opened but never closed
    ok = False

print("Result: Balanced" if ok else "Result: Not Balanced")
