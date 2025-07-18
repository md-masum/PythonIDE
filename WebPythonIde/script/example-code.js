export const exampleCode = {
    // --- Basic Examples ---
    variables: {
        name: "Variables.py",
        code: `
# --- Variables and Data Types ---

# A variable is a container for a value.
# Python is dynamically typed, so you don't need to declare the type.

# String (text)
greeting = "Hello, World!"
print("String:", greeting)

# Integer (whole number)
user_age = 25
print("Integer:", user_age)

# Float (decimal number)
pi_value = 3.14159
print("Float:", pi_value)

# Boolean (True or False)
is_learning = True
print("Boolean:", is_learning)

# You can find out the type of a variable using the type() function
print("Type of greeting:", type(greeting))
print("Type of user_age:", type(user_age))
`.trim()
    },
    operators: {
        name: "Operators.py",
        code: `
# --- Operators ---

# Arithmetic Operators
a = 10
b = 3
print("Addition:", a + b)
print("Subtraction:", a - b)
print("Multiplication:", a * b)
print("Division:", a / b)
print("Floor Division (integer division):", a // b)
print("Modulus (remainder):", a % b)
print("Exponentiation:", a ** b)

# Comparison Operators (return True or False)
x = 5
y = 10
print("Is x equal to y?", x == y)
print("Is x not equal to y?", x != y)
print("Is x greater than y?", x > y)
print("Is x less than or equal to y?", x <= y)

# Logical Operators
is_sunny = True
is_warm = False
print("Is it sunny AND warm?", is_sunny and is_warm)
print("Is it sunny OR warm?", is_sunny or is_warm)
print("Is it NOT sunny?", not is_sunny)
`.trim()
    },
    loops: {
        name: "Loops.py",
        code: `
# --- Loops ---

# 'for' loop: iterates over a sequence (like a list or range)

print("Counting from 0 to 4:")
for i in range(5):  # range(5) generates numbers 0, 1, 2, 3, 4
    print(i)

print("Iterating over a list:")
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# 'while' loop: repeats as long as a condition is true
print("Countdown from 3:")
count = 3
while count > 0:
    print(count)
    count -= 1 # This is equivalent to count = count - 1
print("Go!")
`.trim()
    },
    conditionals: {
        name: "Conditionals.py",
        code: `
# --- Conditionals (if/elif/else) ---

# Conditionals allow you to run different blocks of code
# based on whether a condition is True or False.

temperature = 25

if temperature > 30:
    print("It's a hot day!")
elif temperature > 20: # 'elif' is short for 'else if'
    print("It's a pleasant day.")
else:
    print("It might be cold.")

# You can also use user input
# Note: input() returns a string, so we convert it to an integer
try:
    age_str = input("Enter your age: ")
    age = int(age_str)

    if age < 18:
        print("You are a minor.")
    else:
        print("You are an adult.")
except ValueError:
    print("Please enter a valid number for your age.")
`.trim()
    },

    // --- Intermediate Examples ---
    functions: {
        name: "Functions.py",
        code: `
# --- Functions ---

# A function is a reusable block of code that performs a specific task.

# Defining a simple function
def greet():
    print("Hello from a function!")

# Calling the function
greet()

# Function with a parameter (input)
def greet_person(name):
    print(f"Hello, {name}!")

greet_person("Alice")
greet_person("Bob")

# Function with a return value (output)
def add_numbers(a, b):
    return a + b

sum_result = add_numbers(5, 3)
print("The sum is:", sum_result)

# Function with a default parameter value
def say_hello(name="Guest"):
    print(f"Hello, {name}!")

say_hello() # Uses the default value
say_hello("Charlie") # Overrides the default
`.trim()
    },
    lists: {
        name: "Lists_and_Tuples.py",
        code: `
# --- Lists and Tuples ---

# A list is an ordered and changeable collection of items.
# Defined with square brackets [].
fruits = ["apple", "banana", "cherry"]
print("Original list:", fruits)

# Accessing items by index (starts at 0)
print("First fruit:", fruits[0])

# Changing an item
fruits[1] = "blueberry"
print("Changed list:", fruits)

# Adding an item
fruits.append("orange")
print("Appended list:", fruits)

# Removing an item
fruits.pop() # Removes the last item
print("List after pop:", fruits)

# Looping through a list
for fruit in fruits:
    print(f"I like {fruit}s")

# A tuple is an ordered and UNCHANGEABLE collection.
# Defined with parentheses ().
# They are faster and safer than lists for fixed data.
coordinates = (10.0, 20.0)
print("Tuple of coordinates:", coordinates)

# You can access items, but you cannot change them.
# coordinates[0] = 5.0  # This would cause a TypeError
print("X-coordinate:", coordinates[0])
`.trim()
    },
    dictionaries: {
        name: "Dictionaries.py",
        code: `
# --- Dictionaries ---

# A dictionary is an unordered collection of key-value pairs.
# It's like a real-world dictionary. Defined with curly braces {}.

# Creating a dictionary
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}
print("Person dictionary:", person)

# Accessing values using keys
print("Name:", person["name"])

# Changing a value
person["age"] = 31
print("Updated age:", person["age"])

# Adding a new key-value pair
person["job"] = "Engineer"
print("Added job:", person)

# Looping through a dictionary
print("Iterating through keys and values:")
for key, value in person.items():
    print(f"{key}: {value}")
`.trim()
    },
    files: {
        name: "File_Handling.py",
        code: `
# --- File Handling (Simulated) ---

# In a standard Python environment, you can read from and write to files.
# Pyodide runs in a browser sandbox, so it uses a virtual file system.

file_name = "my_virtual_file.txt"
content_to_write = "Hello from the virtual file system! This is a new line."

# Writing to a file ('w' mode overwrites the file)
try:
    with open(file_name, 'w') as f:
        f.write(content_to_write)
    print(f"Successfully wrote to '{file_name}'")
except Exception as e:
    print(f"Error writing to file: {e}")


# Reading from a file ('r' mode)
try:
    with open(file_name, 'r') as f:
        content_read = f.read()
    print(f"Content read from '{file_name}':")
    print(content_read)
except FileNotFoundError:
    print(f"Error: The file '{file_name}' was not found.")
except Exception as e:
    print(f"Error reading file: {e}")
`.trim()
    },

    // --- Advanced Examples ---
    classes: {
        name: "Classes_and_Objects.py",
        code: `
# --- Classes and Objects ---

# A class is a blueprint for creating objects.
# An object is an instance of a class.

# Defining a class
class Dog:
    # The __init__ method is the constructor, called when an object is created
    def __init__(self, name, age):
        self.name = name  # 'self.name' is an attribute of the object
        self.age = age
        print(f"{self.name} has been created!")

    # This is a method (a function inside a class)
    def bark(self):
        return "Woof!"

    def get_details(self):
        return f"My name is {self.name} and I am {self.age} years old."

# Creating objects (instances) of the Dog class
dog1 = Dog("Buddy", 4)
dog2 = Dog("Lucy", 6)

# Calling methods on the objects
print(f"{dog1.name} says: {dog1.bark()}")
print(dog2.get_details())
`.trim()
    },
    exceptions: {
        name: "Exception_Handling.py",
        code: `
# --- Exception Handling ---

# Sometimes, errors occur during program execution. These are called exceptions.
# We can use try...except blocks to handle them gracefully.

# Example 1: Handling a division by zero error
try:
    numerator = 10
    denominator = 0
    result = numerator / denominator
    print(result)
except ZeroDivisionError:
    print("Error: You cannot divide by zero!")

# Example 2: Handling a file not found error
try:
    with open("non_existent_file.txt", 'r') as f:
        print(f.read())
except FileNotFoundError:
    print("Error: That file does not exist.")

# Example 3: Handling multiple exceptions and using 'finally'
# The 'finally' block runs no matter what, whether an exception occurred or not.
try:
    num_str = input("Enter a number: ")
    num = int(num_str)
    result = 100 / num
    print(f"100 divided by your number is: {result}")
except ValueError:
    print("Invalid input. Please enter a number.")
except ZeroDivisionError:
    print("You can't enter zero.")
finally:
    print("This 'finally' block always executes.")
`.trim()
    },
    imports: {
        name: "Modules_and_Imports.py",
        code: `
# --- Modules and Imports ---

# Python has a rich standard library of modules you can use.
# Pyodide supports many of them!

# The 'math' module provides mathematical functions
import math

print("The value of Pi is:", math.pi)
print("The square root of 16 is:", math.sqrt(16))

# The 'random' module can generate random numbers
import random

print("A random integer between 1 and 100:", random.randint(1, 100))

# You can also import specific functions from a module
from datetime import datetime

# Get the current date and time
now = datetime.now()
print("Current date and time:", now)

# You can also import popular third-party libraries if they are available in Pyodide
# For example, let's try to import numpy
try:
    import numpy as np
    # Create a numpy array
    my_array = np.array([1, 2, 3, 4, 5])
    print("Successfully imported numpy!")
    print("Numpy array:", my_array)
    print("Mean of the array:", np.mean(my_array))
except ImportError:
    print("Numpy is not available in this Pyodide environment by default.")
    print("You might need to load it first.")

`.trim()
    }
};