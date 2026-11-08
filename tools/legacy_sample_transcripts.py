"""Replays every CodeChum sample transcript against the solutions.

The fake input() echoes the typed value + newline, so stdout looks exactly like
the CodeChum 'Sample Output' box (prompt + typed input on the same line).
"""
import io, sys, os, builtins, time

SOL = sys.argv[1]

T = {}
def t(name, transcript, inputs):
    T.setdefault(name, []).append((inputs, transcript.strip("\n")))

# ---------------- PRACTICE ----------------
t("P01_theater_seat_total", "Enter seats in first row: 10\nEnter number of rows: 4\nTotal seats: 52", ["10", "4"])
t("P01_theater_seat_total", "Enter seats in first row: 1\nEnter number of rows: 1\nTotal seats: 1", ["1", "1"])
t("P01_theater_seat_total", "Enter seats in first row: 5\nEnter number of rows: 2\nTotal seats: 12", ["5", "2"])
for f in ["P02_fix_one_street_lamp"]:
    t(f, "Enter lamps: 1011100111101\nLongest lit stretch: 6", ["1011100111101"])
    t(f, "Enter lamps: 111011101110111\nLongest lit stretch: 7", ["111011101110111"])
    t(f, "Enter lamps: 0000\nLongest lit stretch: 1", ["0000"])
for f in ["P03_rotting_fruit_crate", "P03b_rotting_fruit_bfs"]:
    t(f, "Enter rows and columns: 3 3\nEnter the crate:\nFFF\nFFF\nRFF\nMinutes: 4", ["3 3", "FFF", "FFF", "RFF"])
    t(f, "Enter rows and columns: 2 2\nEnter the crate:\nRF\nFF\nMinutes: 2", ["2 2", "RF", "FF"])
    t(f, "Enter rows and columns: 2 3\nEnter the crate:\nFFF\nFFF\nMinutes: 0", ["2 3", "FFF", "FFF"])
t("P04_calculator_without_zeros", "Enter number: 40507\nDisplay: 457", ["40507"])
t("P04_calculator_without_zeros", "Enter number: 1000000000\nDisplay: 1", ["1000000000"])
t("P04_calculator_without_zeros", "Enter number: 98765\nDisplay: 98765", ["98765"])
t("P05_longest_word_length", "Enter sentence: i love programming in c\nLongest word length: 11", ["i love programming in c"])
t("P05_longest_word_length", "Enter sentence: extraordinary day\nLongest word length: 13", ["extraordinary day"])
t("P05_longest_word_length", "Enter sentence: hello\nLongest word length: 5", ["hello"])
t("P06_round_to_nearest_ten", "Enter number: 247\nRounded: 250", ["247"])
t("P06_round_to_nearest_ten", "Enter number: 5\nRounded: 10", ["5"])
t("P06_round_to_nearest_ten", "Enter number: 1234\nRounded: 1230", ["1234"])
t("P06_round_to_nearest_ten", "Enter number: 4\nRounded: 0", ["4"])
t("P06_round_to_nearest_ten", "Enter number: 999\nRounded: 1000", ["999"])
t("P07_warmer_than_yesterday", "Enter N: 6\nEnter the temperatures: 28 30 29 29 31 33\nWarmer days: 3", ["6", "28 30 29 29 31 33"])
t("P07_warmer_than_yesterday", "Enter N: 1\nEnter the temperatures: 25\nWarmer days: 0", ["1", "25"])
t("P07_warmer_than_yesterday", "Enter N: 5\nEnter the temperatures: -2 0 4 5 9\nWarmer days: 4", ["5", "-2 0 4 5 9"])
t("P08_library_late_fines", "Enter number of books: 5\nEnter days kept: 3 9 7 20 12\nTotal fine: 85", ["5", "3 9 7 20 12"])
t("P08_library_late_fines", "Enter number of books: 3\nEnter days kept: 2 7 5\nTotal fine: 0", ["3", "2 7 5"])
t("P08_library_late_fines", "Enter number of books: 1\nEnter days kept: 17\nTotal fine: 50", ["1", "17"])
t("P09_plus_minus_range_sum", "Enter start: 3\nEnter end: 7\nAlternating sum: 5", ["3", "7"])
t("P09_plus_minus_range_sum", "Enter start: 8\nEnter end: 8\nAlternating sum: 8", ["8", "8"])
t("P09_plus_minus_range_sum", "Enter start: 2\nEnter end: 9\nAlternating sum: -4", ["2", "9"])
t("P10_tiered_water_bill", "Enter cubic meters used: 14\nBill: 250", ["14"])
t("P10_tiered_water_bill", "Enter cubic meters used: 0\nBill: 0", ["0"])
t("P10_tiered_water_bill", "Enter cubic meters used: 10\nBill: 150", ["10"])

# ---------------- LAST YEAR: PRELIMS ----------------
t("L01_alternating_character_pattern", "Enter string: bAnAnA\nResult: Alternating", ["bAnAnA"])
t("L01_alternating_character_pattern", "Enter string: apple\nResult: Not Alternating", ["apple"])
t("L01_alternating_character_pattern", "Enter string: h3ll0 W0rld!\nResult: Not Alternating", ["h3ll0 W0rld!"])
t("L02_peak_valley_difference", "Enter array size: 7\nEnter array elements: 10 50 20 80 30 90 40\nResult: 170", ["7", "10 50 20 80 30 90 40"])
t("L02_peak_valley_difference", "Enter array size: 5\nEnter array elements: 1 2 3 4 5\nResult: 0", ["5", "1 2 3 4 5"])
t("L02_peak_valley_difference", "Enter array size: 5\nEnter array elements: 5 4 3 2 1\nResult: 0", ["5", "5 4 3 2 1"])
t("L03_palindromic_prime_counter", "Enter L and R: 1 10\nCount: 4", ["1 10"])
t("L03_palindromic_prime_counter", "Enter L and R: 11 20\nCount: 1", ["11 20"])
t("L03_palindromic_prime_counter", "Enter L and R: 100 200\nCount: 5", ["100 200"])
t("L04_digit_product_sum_series", "Enter N: 234\nTotal sum of sequence: 274", ["234"])
t("L04_digit_product_sum_series", "Enter N: 12\nTotal sum of sequence: 14", ["12"])
t("L04_digit_product_sum_series", "Enter N: 10\nTotal sum of sequence: 10", ["10"])
t("L05_cyclic_array_shift", "Enter array size: 5\nEnter shift amount K: 2\nEnter shift direction (L/R): L\nEnter array elements: 1 2 3 4 5\nShifted array: 3 4 5 1 2", ["5", "2", "L", "1 2 3 4 5"])
t("L05_cyclic_array_shift", "Enter array size: 5\nEnter shift amount K: 2\nEnter shift direction (L/R): R\nEnter array elements: 1 2 3 4 5\nShifted array: 4 5 1 2 3", ["5", "2", "R", "1 2 3 4 5"])
t("L05_cyclic_array_shift", "Enter array size: 7\nEnter shift amount K: 10\nEnter shift direction (L/R): L\nEnter array elements: -5 0 12 34 -99 100 7\nShifted array: 34 -99 100 7 -5 0 12", ["7", "10", "L", "-5 0 12 34 -99 100 7"])
t("L05_cyclic_array_shift", "Enter array size: 3\nEnter shift amount K: 0\nEnter shift direction (L/R): R\nEnter array elements: 1 2 3\nShifted array: 1 2 3", ["3", "0", "R", "1 2 3"])
t("L06_pascals_pyramid", "Enter the number of rows (N): 1\nPascal's Triangle with 1 rows:\n1", ["1"])
t("L06_pascals_pyramid", "Enter the number of rows (N): 3\nPascal's Triangle with 3 rows:\n1\n1 1\n1 2 1", ["3"])
t("L06_pascals_pyramid", "Enter the number of rows (N): 5\nPascal's Triangle with 5 rows:\n1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1", ["5"])
t("L07_stable_sequence_reduction", "Enter the number of elements and the threshold: 4 2.0\nEnter the sequence: 10 11 13 15\nFinal stable sequence: 10.50 14.00", ["4 2.0", "10 11 13 15"])
t("L07_stable_sequence_reduction", "Enter the number of elements and the threshold: 5 3.0\nEnter the sequence: 10 12 20 22 30\nFinal stable sequence: 11.00 21.00 30.00", ["5 3.0", "10 12 20 22 30"])
t("L07_stable_sequence_reduction", "Enter the number of elements and the threshold: 4 5.0\nEnter the sequence: 10 20 30 40\nFinal stable sequence: 10.00 20.00 30.00 40.00", ["4 5.0", "10 20 30 40"])
t("L08_maximal_square_of_ones", "Enter rows and cols: 4 5\nEnter the matrix:\n1 0 1 1 1\n1 1 1 1 1\n1 1 1 1 1\n1 0 1 1 0\nLargest square side: 3", ["4 5", "1 0 1 1 1", "1 1 1 1 1", "1 1 1 1 1", "1 0 1 1 0"])
t("L08_maximal_square_of_ones", "Enter rows and cols: 3 3\nEnter the matrix:\n0 0 0\n0 0 0\n0 0 0\nLargest square side: 0", ["3 3", "0 0 0", "0 0 0", "0 0 0"])
t("L08_maximal_square_of_ones", "Enter rows and cols: 1 5\nEnter the matrix:\n0 1 1 0 1\nLargest square side: 1", ["1 5", "0 1 1 0 1"])

# ---------------- LAST YEAR: SEMIS ----------------
t("S01_alternating_factorial_sum", "Enter a positive integer N: 1\nThe alternating factorial sum is: 1", ["1"])
t("S01_alternating_factorial_sum", "Enter a positive integer N: 3\nThe alternating factorial sum is: 5", ["3"])
t("S01_alternating_factorial_sum", "Enter a positive integer N: 4\nThe alternating factorial sum is: -19", ["4"])
t("S02_digital_root", "Enter a number: 65536\nDigital Root: 7", ["65536"])
t("S02_digital_root", "Enter a number: 99\nDigital Root: 9", ["99"])
t("S02_digital_root", "Enter a number: 123\nDigital Root: 6", ["123"])
t("S02_digital_root", "Enter a number: 0\nDigital Root: 0", ["0"])
t("S03_positional_cipher", "Enter the encoded string: kiqrv\nEnter the key: 3\nDecoded string: hello", ["kiqrv", "3"])
t("S03_positional_cipher", "Enter the encoded string: Mzpr\nEnter the key: 10\nDecoded string: Code", ["Mzpr", "10"])
t("S03_positional_cipher", "Enter the encoded string: sfeuiy\nEnter the key: 0\nDecoded string: secret", ["sfeuiy", "0"])
t("S04_digit_sum_power_sum", "Enter N: 1\nTotal sum: 1", ["1"])
t("S04_digit_sum_power_sum", "Enter N: 9\nTotal sum: 45", ["9"])
t("S04_digit_sum_power_sum", "Enter N: 20\nTotal sum: 434", ["20"])
t("S05_roman_to_integer", "Enter Roman numeral: III\nInteger value: 3", ["III"])
t("S05_roman_to_integer", "Enter Roman numeral: LVIII\nInteger value: 58", ["LVIII"])
t("S05_roman_to_integer", "Enter Roman numeral: MCMXCIV\nInteger value: 1994", ["MCMXCIV"])
t("S06_smallest_missing_subarray_sum", "Enter array size: 4\nEnter the array elements: 3 1 2 7\nSmallest Missing Sum: 5", ["4", "3 1 2 7"])
t("S06_smallest_missing_subarray_sum", "Enter array size: 3\nEnter the array elements: 10 2 8\nSmallest Missing Sum: 1", ["3", "10 2 8"])
t("S06_smallest_missing_subarray_sum", "Enter array size: 4\nEnter the array elements: 1 2 3 4\nSmallest Missing Sum: 8", ["4", "1 2 3 4"])
t("S06_smallest_missing_subarray_sum", "Enter array size: 4\nEnter the array elements: 1 2 5 7\nSmallest Missing Sum: 4", ["4", "1 2 5 7"])
t("S07_zigzag_conversion", "Enter string: PAYPALISHIRING\nEnter number of rows: 3\nConverted string: PAHNAPLSIIGYIR", ["PAYPALISHIRING", "3"])
t("S07_zigzag_conversion", "Enter string: ABCDEFGHIJKLMNOPQRSTUVWXYZ\nEnter number of rows: 5\nConverted string: AIQYBHJPRXZCGKOSWDFLNTVEMU", ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "5"])
t("S07_zigzag_conversion", "Enter string: THISISATEST\nEnter number of rows: 8\nConverted string: THISITSSAET", ["THISISATEST", "8"])
t("S07_zigzag_conversion", "Enter string: AB\nEnter number of rows: 1\nConverted string: AB", ["AB", "1"])
t("S08_largest_symmetric_subgrid", "Enter size of matrix: 4\nEnter matrix elements:\n1 2 3 4\n5 6 7 8\n8 7 6 5\n4 3 2 1\nLargest symmetric subgrid size: 4", ["4", "1 2 3 4", "5 6 7 8", "8 7 6 5", "4 3 2 1"])
t("S08_largest_symmetric_subgrid", "Enter size of matrix: 5\nEnter matrix elements:\n9 1 2 3 9\n8 1 2 1 8\n7 4 5 4 7\n6 1 2 1 6\n5 1 2 3 5\nLargest symmetric subgrid size: 3", ["5", "9 1 2 3 9", "8 1 2 1 8", "7 4 5 4 7", "6 1 2 1 6", "5 1 2 3 5"])
t("S08_largest_symmetric_subgrid", "Enter size of matrix: 3\nEnter matrix elements:\n1 2 3\n4 5 6\n7 8 9\nLargest symmetric subgrid size: 1", ["3", "1 2 3", "4 5 6", "7 8 9"])


def run(path, inputs):
    feed = iter(inputs)
    out = io.StringIO()
    def fake_input(prompt=""):
        out.write(str(prompt))
        line = next(feed)
        out.write(line + "\n")      # echo like the CodeChum terminal
        return line
    old_out, old_in = sys.stdout, builtins.input
    sys.stdout, builtins.input = out, fake_input
    try:
        code = compile(open(path, encoding="utf-8").read(), path, "exec")
        exec(code, {"__name__": "__main__"})
    finally:
        sys.stdout, builtins.input = old_out, old_in
    return out.getvalue()


def norm(s):
    return "\n".join(line.rstrip() for line in s.strip("\n").split("\n"))


files = sorted(f[:-3] for f in os.listdir(SOL) if f.endswith(".py"))
passed = failed = 0
for name in files:
    cases = T.get(name)
    if not cases:
        print(f"!! no tests for {name}")
        continue
    for i, (inputs, expected) in enumerate(cases, 1):
        try:
            got = run(os.path.join(SOL, name + ".py"), inputs)
        except Exception as e:
            got = f"EXCEPTION: {e!r}"
        if norm(got) == norm(expected):
            passed += 1
        else:
            failed += 1
            print(f"FAIL {name} case {i}\n--- expected\n{expected}\n--- got\n{got}")
print(f"\n{passed} passed, {failed} failed, {len(files)} files")
