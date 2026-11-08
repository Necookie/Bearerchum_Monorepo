N = int(input("Enter number: "))

# Integer trick: add 5, then chop the last digit
rounded = (N + 5) // 10 * 10

# Same thing, written as the problem describes it:
# if N % 10 >= 5: rounded = N - N % 10 + 10
# else:           rounded = N - N % 10
print(f"Rounded: {rounded}")
