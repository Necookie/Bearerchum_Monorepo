parts = input("Enter the number of elements and the threshold: ").split()
N = int(parts[0])
T = float(parts[1])
seq = [float(x) for x in input("Enter the sequence: ").split()]

while True:
    new_seq = []
    merged = False
    i = 0
    while i < len(seq):
        if i + 1 < len(seq) and abs(seq[i] - seq[i + 1]) <= T:
            new_seq.append((seq[i] + seq[i + 1]) / 2)   # merge the pair
            i += 2                                      # skip both
            merged = True
        else:
            new_seq.append(seq[i])
            i += 1
    seq = new_seq
    if not merged:                                      # full pass, no merge -> stable
        break

print("Final stable sequence:", " ".join(f"{x:.2f}" for x in seq))
