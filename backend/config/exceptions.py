from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'error': 'An error occurred',
            'fields': {}
        }
        
        if isinstance(response.data, dict):
            # If it's a validation error, put details in 'fields'
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                custom_data['error'] = 'Validation failed'
                custom_data['fields'] = response.data
            else:
                # Handle general error messages
                detail = response.data.get('detail', str(response.data))
                custom_data['error'] = detail
        elif isinstance(response.data, list):
            custom_data['error'] = response.data[0]
            
        response.data = custom_data

    return response
