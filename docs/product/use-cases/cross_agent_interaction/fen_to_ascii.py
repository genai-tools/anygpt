#!/usr/bin/env python3
import sys

def fen_to_ascii(fen):
    """Convert FEN notation to ASCII chess board representation."""
    board_part = fen.split(' ')[0]
    rows = board_part.split('/')
    
    ascii_board = "  a b c d e f g h\n"
    ascii_board += " +-----------------+\n"
    
    for i, row in enumerate(rows):
        rank = 8 - i
        ascii_board += f"{rank}| "
        
        for char in row:
            if char.isdigit():
                ascii_board += ". " * int(char)
            else:
                ascii_board += char + " "
        
        ascii_board += f"|{rank}\n"
    
    ascii_board += " +-----------------+\n"
    ascii_board += "  a b c d e f g h\n"
    
    return ascii_board

if __name__ == "__main__":
    if len(sys.argv) > 1:
        fen_string = sys.argv[1]
        print(fen_to_ascii(fen_string))
    else:
        # Default: show initial position
        default_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        print("Usage: python fen_to_ascii.py <FEN_string>")
        print("\nExample with initial position:")
        print(fen_to_ascii(default_fen))