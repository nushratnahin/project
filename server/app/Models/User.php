<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'deleted_at'        => 'datetime',
    ];

    public function records()
    {
        return $this->hasMany(Record::class);
    }

    public function isAdmin(): bool
    {
        return $this->type === 'admin';
    }

    public function isMember(): bool
    {
        return $this->type === 'member';
    }

    public function activeRecords()
    {
        return $this->records()->whereNull('returned_at');
    }
}
