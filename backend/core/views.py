from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework import status
from .serializers import AdminUserSerializer, EmployeeCreateSerializer

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_staff_users(request):
    users = User.objects.filter(is_staff=True)
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_email(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    email = request.data.get("email")
    if not email:
        return Response({"error": "Email required"}, status=400)

    user.email = email
    user.save()
    return Response({"message": "Email updated"})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_staff_status(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    user.is_staff = not user.is_staff
    user.save()
    return Response({"message": "Staff status toggled"})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def deactivate_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    user.is_active = False
    user.save()
    return Response({"message": "User deactivated"})

@api_view(['POST'])
@permission_classes([AllowAny])
def create_employee(request):
    serializer = EmployeeCreateSerializer(data=request.data)

    if serializer.is_valid():
        employee = serializer.save()
        return Response(
            {
                "id": employee.id,
                "username": employee.username,
                "email": employee.email,
                "is_staff": employee.is_staff,
                "first_name": employee.first_name,
                "last_name": employee.last_name
            },
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)