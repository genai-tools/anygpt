import chess
import sys
from docs.products.anygpt.cases.cross_agent_interaction.fen_to_ascii import fen_to_ascii
import json

# Define a placeholder for use_mcp_tool if it's not provided by the environment
try:
    # This import will only work when run within the agent's environment
    from mcp_tool_interface import use_mcp_tool
except ImportError:
    # Fallback for local execution
    def use_mcp_tool(server_name, tool_name, arguments):
        if tool_name == "anygpt_chat_completion":
            messages = arguments.get("messages", [])
            last_message_content = messages[-1]["content"] if messages else ""
            print(last_message_content)
            return {"result": {"choices": [{"message": {"content": input("AnyGPT, make a move (e.g., e2e4): ")}}]}}
        else:
            raise NotImplementedError(f"Tool {tool_name} not implemented for local fallback.")

def get_anygpt_move(board_ascii):
    """
    Sends the ASCII board to anygpt and returns the move in UCI format.
    """
    system_message = {
        "role": "system",
        "content": "You are a chess engine. Respond only with a single UCI move (e.g., 'e2e4'). Do not include any other text, explanations, or formatting."
    }
    user_message = {
        "role": "user",
        "content": f"Here is the current chess board:\n{board_ascii}\nWhat is your next move?"
    }

    response = use_mcp_tool(
        server_name="anygpt",
        tool_name="anygpt_chat_completion",
        arguments={
            "messages": [system_message, user_message],
            "max_tokens": 10 # Expecting a short UCI move
        }
    )
    
    response_content = response.get('result', {}).get('choices', [{}])[0].get('message', {}).get('content', '').strip()
    return response_content

def play_chess_game():
    board = chess.Board()
    moves_played = []
    
    print("Starting chess game against AnyGPT.")
    print("Initial Board:")
    print(fen_to_ascii(board.fen()))

    for i in range(10): # Play 10 steps as requested
        if board.is_game_over():
            print("Game Over!")
            break

        print(f"\n--- Step {i+1} ---")
        
        # Get AnyGPT's move
        board_ascii = fen_to_ascii(board.fen())
        anygpt_move_uci = get_anygpt_move(board_ascii)
        
        try:
            move = chess.Move.from_uci(anygpt_move_uci)
            if move in board.legal_moves:
                board.push(move)
                moves_played.append(move.uci())
                print(f"AnyGPT played: {anygpt_move_uci}")
                print("Current Board:")
                print(fen_to_ascii(board.fen()))
            else:
                print(f"Invalid move received from AnyGPT: {anygpt_move_uci}. AnyGPT must provide a legal move.")
                break
        except ValueError:
            print(f"Could not parse move received from AnyGPT: {anygpt_move_uci}. AnyGPT must provide a move in UCI format.")
            break
        
    print("\n--- Game End ---")
    print("Moves Played:", moves_played)
    print("Final FEN:", board.fen())
    return moves_played, board.fen()

if __name__ == "__main__":
    play_chess_game()
