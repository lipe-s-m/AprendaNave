using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using server.Domain.DTOs;
using server.Domain.Interfaces;
using server.Repository.Database;

public class ImageService : IImageService
{
	private readonly Cloudinary _cloudinary;
	private readonly DbContexto dbContext;
	// Receba o IConfiguration no construtor
	public ImageService(IConfiguration config, DbContexto context)
	{
		var envUrl = config["CLOUDINARY_URL"];
		_cloudinary = new Cloudinary(envUrl);
		_cloudinary.Api.Secure = true;
		dbContext = context;
	}
	public async Task<ImageUploadResult> AddImageAsync(IFormFile file, string folderName, string name)
	{
		var uploadResult = new ImageUploadResult();

		if (file.Length > 0)
		{
			using var stream = file.OpenReadStream();
			var uploadParams = new ImageUploadParams
			{
				File = new FileDescription(file.FileName, stream),
				Folder = folderName,
				PublicId = name,
				Overwrite = true,
				Transformation = new Transformation().Height(500).Width(500).Crop("fill") // Redimensiona auto
			};
			uploadResult = await _cloudinary.UploadAsync(uploadParams);
		}

		return uploadResult;
	}
	public async Task<UserResponseDTO> UpdateProfileImage(int alunoId, ImageUploadResult uploadResult)
	{
		var aluno = await dbContext.Alunos.FirstOrDefaultAsync(a => a.Id == alunoId);
		if (aluno == null)
		{
			throw new Exception("Aluno não encontrado");
		}

		aluno.FotoPerfil = uploadResult.SecureUrl.AbsoluteUri;

		dbContext.Alunos.Update(aluno);
		await dbContext.SaveChangesAsync();

		return new UserResponseDTO(aluno);
	}
}