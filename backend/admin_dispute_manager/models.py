# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Disputes(models.Model):
    id = models.UUIDField(primary_key=True)
    transaction = models.ForeignKey('Transactions', models.DO_NOTHING)
    raised_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='raised_by')
    against = models.ForeignKey('Users', models.DO_NOTHING, db_column='against', related_name='disputes_against_set')
    reason = models.TextField()
    evidence_paths = models.TextField(blank=True, null=True)  # This field type is a guess.
    status = models.TextField(blank=True, null=True)
    assigned_mediator = models.ForeignKey('Users', models.DO_NOTHING, db_column='assigned_mediator', related_name='disputes_assigned_mediator_set', blank=True, null=True)
    assigned_at = models.DateTimeField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='resolved_by', related_name='disputes_resolved_by_set', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    

    class Meta:
        managed = False
        db_table = 'disputes'
        app_label = 'admin_dispute_manager'


class Escrow(models.Model):
    id = models.UUIDField(primary_key=True)
    transaction = models.OneToOneField('Transactions', models.DO_NOTHING)
    terms = models.TextField()
    agreed_by_buyer = models.BooleanField(blank=True, null=True)
    agreed_by_seller = models.BooleanField(blank=True, null=True)
    terms_agreed_at = models.DateTimeField(blank=True, null=True)
    buyer_confirmed = models.BooleanField(blank=True, null=True)
    buyer_confirmed_at = models.DateTimeField(blank=True, null=True)
    seller_confirmed = models.BooleanField(blank=True, null=True)
    seller_confirmed_at = models.DateTimeField(blank=True, null=True)
    funds_held = models.BooleanField(blank=True, null=True)
    funds_released = models.BooleanField(blank=True, null=True)
    funds_released_at = models.DateTimeField(blank=True, null=True)
    release_triggered_by = models.TextField(blank=True, null=True)
    auto_release_at = models.DateTimeField(blank=True, null=True)
    auto_trigger_fired = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'escrow'


class KycDocuments(models.Model):
    id = models.UUIDField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING)
    document_type = models.TextField()
    storage_path = models.TextField()
    status = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='reviewed_by', related_name='kycdocuments_reviewed_by_set', blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'kyc_documents'


class Transactions(models.Model):
    id = models.UUIDField(primary_key=True)
    buyer = models.ForeignKey('Users', models.DO_NOTHING)
    seller = models.ForeignKey('Users', models.DO_NOTHING, related_name='transactions_seller_set')
    title = models.TextField()
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.TextField(blank=True, null=True)
    delivery_deadline = models.DateTimeField(blank=True, null=True)
    payfast_payment_id = models.TextField(unique=True, blank=True, null=True)
    payfast_token = models.TextField(blank=True, null=True)
    payment_method = models.TextField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)
    funded_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'transactions'


class Users(models.Model):
    id = models.UUIDField(primary_key=True)
    email = models.TextField(unique=True)
    password = models.TextField()
    full_name = models.TextField()
    phone_number = models.TextField(blank=True, null=True)
    role = models.TextField()
    national_id_number = models.TextField(unique=True, blank=True, null=True)
    id_document_type = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    nationality = models.TextField(blank=True, null=True)
    gender = models.TextField(blank=True, null=True)
    is_email_verified = models.BooleanField(blank=True, null=True)
    is_2fa_enabled = models.BooleanField(blank=True, null=True)
    totp_secret = models.TextField(blank=True, null=True)
    kyc_status = models.TextField(blank=True, null=True)
    kyc_verified_at = models.DateTimeField(blank=True, null=True)
    face_scan_verified = models.BooleanField(blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
