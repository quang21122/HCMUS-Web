import pandas as pd

def remove_duplicates(input_file, output_file):
    """
    Remove duplicate rows from a CSV file and save the result to a new file.

    :param input_file: Path to the input CSV file
    :param output_file: Path to save the deduplicated CSV file
    """
    try:
        # Load the CSV file into a pandas DataFrame
        df = pd.read_csv(input_file)
        
        # Remove duplicates
        df_deduplicated = df.drop_duplicates()
        
        # Save the deduplicated DataFrame to a new CSV file
        df_deduplicated.to_csv(output_file, index=False)
        print(f"Duplicates removed. Saved deduplicated file to: {output_file}")
    
    except Exception as e:
        print(f"An error occurred: {e}")

import pandas as pd

def remove_rows_with_keyword(input_file, output_file, keyword):
    """
    Remove all rows containing a specific keyword from a CSV file.

    :param input_file: Path to the input CSV file
    :param output_file: Path to save the cleaned CSV file
    :param keyword: The keyword to search for and remove rows
    """
    try:
        # Load the CSV file into a pandas DataFrame
        df = pd.read_csv(input_file)
        
        # Remove rows containing the keyword in any column
        df_cleaned = df[~df.apply(lambda row: row.astype(str).str.contains(keyword).any(), axis=1)]
        
        # Save the cleaned DataFrame to a new CSV file
        df_cleaned.to_csv(output_file, index=False)
        print(f"Rows with '{keyword}' removed. Saved cleaned file to: {output_file}")
    
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
input_csv = "news.csv"   # Replace with your input file name
output_csv = "news.csv" # Replace with your desired output file name
keyword = "#box_comment_vne" # The keyword to remove rows with
remove_rows_with_keyword(input_csv, output_csv, keyword)

# Example usage
# input_csv = "urls.csv"   # Replace with your input file name
# output_csv = "news.csv" # Replace with your desired output file name
# remove_duplicates(input_csv, output_csv)
