using CloudinaryDotNet.Actions;
using server.Domain.DTOs;
using server.Domain.Entities;

namespace server.Domain.Interfaces
{
	public interface IImageService
	{
		Task<ImageUploadResult> AddImageAsync(IFormFile file, string folderName, string name);
		Task<UserResponseDTO> UpdateProfileImage(int alunoId, ImageUploadResult uploadResult);
	}
}
