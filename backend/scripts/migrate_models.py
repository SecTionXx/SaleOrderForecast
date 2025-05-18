#!/usr/bin/env python3
"""
Script to help migrate JavaScript data models to Pydantic models.

This script analyzes JavaScript model files and generates equivalent Pydantic models.
"""
import os
import re
import json
import argparse
from typing import Dict, List, Any, Optional


def extract_js_models(js_file_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Extract model definitions from a JavaScript file.
    
    Args:
        js_file_path: Path to the JavaScript file
        
    Returns:
        Dictionary of model names and their properties
    """
    with open(js_file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Simple regex-based extraction (this is a basic implementation)
    # In a real scenario, you might want to use a proper JS parser
    models = {}
    
    # Look for class definitions
    class_matches = re.finditer(r'class\s+(\w+)\s*{', content)
    for match in class_matches:
        class_name = match.group(1)
        class_content = extract_class_content(content, match.end())
        
        # Extract properties
        properties = {}
        prop_matches = re.finditer(r'this\.(\w+)\s*=\s*([^;]+);', class_content)
        for prop_match in prop_matches:
            prop_name = prop_match.group(1)
            prop_value = prop_match.group(2).strip()
            
            # Try to determine the type
            prop_type = infer_type(prop_value)
            properties[prop_name] = {
                'type': prop_type,
                'default': prop_value if prop_value != 'undefined' else None
            }
        
        models[class_name] = properties
    
    # Look for object literals (e.g., const model = { ... })
    obj_matches = re.finditer(r'(?:const|let|var)\s+(\w+)\s*=\s*{', content)
    for match in obj_matches:
        obj_name = match.group(1)
        obj_content = extract_object_content(content, match.end() - 1)
        
        # Extract properties
        properties = {}
        prop_matches = re.finditer(r'(\w+)\s*:\s*([^,}]+)', obj_content)
        for prop_match in prop_matches:
            prop_name = prop_match.group(1)
            prop_value = prop_match.group(2).strip()
            
            # Try to determine the type
            prop_type = infer_type(prop_value)
            properties[prop_name] = {
                'type': prop_type,
                'default': prop_value if prop_value != 'undefined' else None
            }
        
        models[obj_name] = properties
    
    return models


def extract_class_content(content: str, start_pos: int) -> str:
    """
    Extract the content of a class definition.
    
    Args:
        content: Full file content
        start_pos: Position after the opening brace
        
    Returns:
        Content of the class
    """
    brace_count = 1
    end_pos = start_pos
    
    while brace_count > 0 and end_pos < len(content):
        if content[end_pos] == '{':
            brace_count += 1
        elif content[end_pos] == '}':
            brace_count -= 1
        end_pos += 1
    
    return content[start_pos:end_pos-1]


def extract_object_content(content: str, start_pos: int) -> str:
    """
    Extract the content of an object literal.
    
    Args:
        content: Full file content
        start_pos: Position of the opening brace
        
    Returns:
        Content of the object
    """
    brace_count = 1
    end_pos = start_pos + 1
    
    while brace_count > 0 and end_pos < len(content):
        if content[end_pos] == '{':
            brace_count += 1
        elif content[end_pos] == '}':
            brace_count -= 1
        end_pos += 1
    
    return content[start_pos+1:end_pos-1]


def infer_type(value: str) -> str:
    """
    Infer the Python type from a JavaScript value.
    
    Args:
        value: JavaScript value as string
        
    Returns:
        Python type as string
    """
    value = value.strip()
    
    if value in ('null', 'undefined'):
        return 'Optional[Any]'
    elif value in ('true', 'false'):
        return 'bool'
    elif value.startswith('"') or value.startswith("'"):
        return 'str'
    elif value.startswith('['):
        return 'List[Any]'
    elif value.startswith('{'):
        return 'Dict[str, Any]'
    elif re.match(r'^-?\d+$', value):
        return 'int'
    elif re.match(r'^-?\d+\.\d+$', value):
        return 'float'
    elif value.startswith('new Date'):
        return 'datetime'
    else:
        return 'Any'


def generate_pydantic_model(model_name: str, properties: Dict[str, Any]) -> str:
    """
    Generate a Pydantic model from properties.
    
    Args:
        model_name: Name of the model
        properties: Dictionary of properties and their types
        
    Returns:
        Pydantic model as string
    """
    imports = [
        'from pydantic import BaseModel, Field',
        'from typing import Optional, List, Dict, Any',
        'from datetime import datetime, date'
    ]
    
    model_lines = [
        f'class {model_name}(BaseModel):',
        f'    """',
        f'    {model_name} model.',
        f'    """'
    ]
    
    for prop_name, prop_info in properties.items():
        prop_type = prop_info['type']
        default_value = prop_info['default']
        
        # Format the field
        if default_value in ('null', 'undefined', None):
            model_lines.append(f'    {prop_name}: Optional[{prop_type}] = None')
        elif prop_type == 'str' and (default_value.startswith('"') or default_value.startswith("'")):
            # Remove quotes for string defaults
            default_value = default_value.strip('"\'')
            model_lines.append(f'    {prop_name}: {prop_type} = "{default_value}"')
        elif prop_type == 'bool':
            default_value = 'True' if default_value == 'true' else 'False'
            model_lines.append(f'    {prop_name}: {prop_type} = {default_value}')
        elif prop_type == 'datetime':
            model_lines.append(f'    {prop_name}: {prop_type} = None')
        else:
            model_lines.append(f'    {prop_name}: {prop_type}')
    
    # Add Config class for examples
    model_lines.extend([
        '',
        '    class Config:',
        '        schema_extra = {',
        '            "example": {',
    ])
    
    for prop_name, prop_info in properties.items():
        prop_type = prop_info['type']
        
        # Generate example values
        if prop_type == 'str':
            example_value = f'"{prop_name}_example"'
        elif prop_type == 'int':
            example_value = '42'
        elif prop_type == 'float':
            example_value = '42.5'
        elif prop_type == 'bool':
            example_value = 'True'
        elif prop_type == 'datetime':
            example_value = '"2025-05-18T10:00:00Z"'
        elif prop_type == 'List[Any]':
            example_value = '[]'
        elif prop_type == 'Dict[str, Any]':
            example_value = '{}'
        else:
            example_value = 'None'
        
        model_lines.append(f'                "{prop_name}": {example_value},')
    
    model_lines.extend([
        '            }',
        '        }'
    ])
    
    return '\n'.join(imports + ['', ''] + model_lines)


def main():
    parser = argparse.ArgumentParser(description='Migrate JavaScript models to Pydantic models')
    parser.add_argument('js_file', help='Path to JavaScript model file')
    parser.add_argument('--output-dir', default='app/schemas', help='Output directory for Pydantic models')
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Extract models from JavaScript file
    models = extract_js_models(args.js_file)
    
    # Generate Pydantic models
    for model_name, properties in models.items():
        pydantic_model = generate_pydantic_model(model_name, properties)
        
        # Write to file
        output_file = os.path.join(args.output_dir, f'{model_name.lower()}.py')
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write(pydantic_model)
        
        print(f'Generated Pydantic model for {model_name} at {output_file}')


if __name__ == '__main__':
    main()
