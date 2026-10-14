import hashlib


def hash_it(input: list[str]) -> list[str]:
    """
    Hashes each input string using the SHA-256 algorithm and returns the
    hexadecimal representation of each hash.

    Args:
        input (list[str]): The strings to be hashed.

    Returns:
        list[str]: The hexadecimal representations of the hashes.
    """
    return [hashlib.sha256(s.encode()).hexdigest() for s in input]

