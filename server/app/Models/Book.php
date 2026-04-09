<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'description',
        'isbn_no',
        'image_path',
        'category_id',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function records()
    {
        return $this->hasMany(Record::class);
    }

    public function activeRecord()
    {
        return $this->hasOne(Record::class)->whereNull('returned_at');
    }

    public function isAvailable(): bool
    {
        return !$this->records()->whereNull('returned_at')->exists();
    }
}
